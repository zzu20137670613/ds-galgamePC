import { app, BrowserWindow, ipcMain } from "electron";
import { join, dirname, extname } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
app.commandLine.appendSwitch("disable-features", "ServiceWorker");

// ⚠⚠ 重要：探针必须使用【独立 userData 目录】！
// 不隔离的话它会和用户实际安装的游戏共用 %APPDATA%\deepseek-gal ——
// 探针开头的 indexedDB.deleteDatabase + localStorage.clear() 会清掉/锁住用户正在运行的游戏状态
//（表现为：触发词卡死"被吃"、探索按钮消失"像点了退出"）。2026-10-07 事故教训。
app.setPath("userData", join(app.getPath("temp"), "gal-chainprobe-userdata"));

// 场景选择：--scenario=s1|s2|s3（默认 s1）
const SCENARIO = (process.argv.find((a) => /^--scenario=/.test(a))?.split("=")[1]) || "s1";
const SCEN = {
    s1: {
        name: "S1-1 → S1-2",
        segments: { "s1-1": "played" },
        exploreSeq: { "s1-1": 4 },
        expectSeq: "2/9",
        exploreBtn: "探索星海图书馆",
    },
    s2: {
        name: "S2-1 → S2-2",
        segments: { "s1-1": "played", "s1-2": "played", "s1-3": "played", "s2-1": "played" },
        exploreSeq: { "s2-1": 4 },
        expectSeq: "5/9",
        exploreBtn: "探索天空之城",
    },
    s3: {
        name: "S3-1 → S3-2",
        segments: {
            "s1-1": "played", "s1-2": "played", "s1-3": "played",
            "s2-1": "played", "s2-2": "played", "s2-3": "played", "s3-1": "played",
        },
        exploreSeq: { "s3-1": 4 },
        expectSeq: "8/9",
        exploreBtn: "探索亚特兰蒂斯",
    },
    // ── entry 模式：模拟「老存档进入新场景」的首次关键词触发（测 syncSceneUnlocks 补解锁 + 首次是否被吞）──
    s2entry: {
        name: "S2-1 首次关键词进入（老存档 s2-1 locked）",
        mode: "entry",
        segments: { "s1-1": "played", "s1-2": "played", "s1-3": "played" },
        exploreSeq: {},
        exploreOpen: false,
        sendText: "我想问问月桥和云端的事",
        expectSeq: "4/9",
    },
    s3entry: {
        name: "S3-1 首次关键词进入（老存档 s3-1 locked）",
        mode: "entry",
        segments: {
            "s1-1": "played", "s1-2": "played", "s1-3": "played",
            "s2-1": "played", "s2-2": "played", "s2-3": "played",
        },
        exploreSeq: {},
        exploreOpen: false,
        sendText: "深海沉没的亚特兰蒂斯，是真的吗？",
        expectSeq: "7/9",
    },
// ── fresh 模式：复刻用户现场（全新档 → 首消息触发 S1-1 → 跳过 → 探索×N）──
    fresh: {
        name: "全新档：首消息触发 S1-1 → 跳过 → 探索×N（复刻现场）",
        mode: "fresh",
    },
}[SCENARIO];
if (!SCEN) { console.log("BAD SCENARIO:", SCENARIO); app.exit(1); }
console.log("=== SCENARIO:", SCEN.name, "===");

const TEST_MEMORY_DIR = join(app.getPath("userData"), "whale-memory-chainprobe");
const TEST_CONV = join(TEST_MEMORY_DIR, "conversation.json");
const TEST_MEM = join(TEST_MEMORY_DIR, "memories.json");
function tRead(f) { if (!existsSync(f)) return null; try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return null; } }
function tWrite(f, d) { mkdirSync(TEST_MEMORY_DIR, { recursive: true }); writeFileSync(f, JSON.stringify(d, null, 2), "utf-8"); }

ipcMain.handle("archive:loadAll", () => tRead(TEST_CONV)?.messages ?? []);
ipcMain.handle("archive:append", (_e, message) => {
    const record = tRead(TEST_CONV) ?? {};
    const incoming = Array.isArray(message) ? message : [message];
    tWrite(TEST_CONV, { messages: [...(record.messages ?? []), ...incoming] });
    return true;
});
ipcMain.handle("archive:reset", () => { try { rmSync(TEST_CONV, { force: true }); } catch {} return true; });
ipcMain.handle("archive:replaceAll", (_e, messages) => { tWrite(TEST_CONV, { messages: Array.isArray(messages) ? messages : [] }); return true; });
ipcMain.handle("memory:loadAll", () => tRead(TEST_MEM)?.memories ?? []);
ipcMain.handle("memory:save", (_e, memories) => { tWrite(TEST_MEM, { memories }); return true; });
ipcMain.handle("api:chat", async () => ({ ok: true, status: 200, data: { choices: [{ message: { content: "（测试回复）" } }] } }));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".map": "application/json; charset=utf-8" };

app.whenReady().then(async () => {
    try { rmSync(TEST_MEMORY_DIR, { recursive: true, force: true }); } catch {}
    const distDir = join(__dirname, "../dist");
    const server = createServer((req, res) => {
        const url = new URL(req.url, "http://127.0.0.1");
        let p = decodeURIComponent(url.pathname);
        if (p === "/" || p === "") p = "/index.html";
        const fp = join(distDir, p);
        if (!existsSync(fp)) { res.writeHead(404).end("NF"); return; }
        res.writeHead(200, { "Content-Type": MIME[extname(fp).toLowerCase()] || "application/octet-stream" });
        res.end(readFileSync(fp));
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const port = server.address().port;

    const win = new BrowserWindow({
        width: 1280, height: 800, show: false,
        webPreferences: { preload: join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
    });

    const logs = [];
    win.webContents.on("console-message", (_e, level, message) => {
        logs.push(`[L${level}] ${String(message).slice(0, 300)}`);
    });

    await win.loadURL(`http://127.0.0.1:${port}/`);
    await new Promise((r) => setTimeout(r, 9000));

    const js = async (code, tag) => {
        for (let a = 0; a < 4; a++) {
            try { return await win.webContents.executeJavaScript(code); }
            catch (err) { console.log(`[STEP_FAIL] ${tag} a=${a}:`, String(err?.stack || err).split("\n").slice(0, 2).join(" | ")); await new Promise((r) => setTimeout(r, 1500)); }
        }
        return { EXEC_FAILED: tag };
    };

    await js(`
        window.__errs = [];
        const _oe = console.error.bind(console);
        console.error = (...a) => { try { window.__errs.push('[E] ' + a.map(x => String(x && x.stack || x && x.message || x)).join(' || ')); } catch (e) {} _oe(...a); };
        const _ow = console.warn.bind(console);
        console.warn = (...a) => { try { window.__errs.push('[W] ' + a.map(x => String(x && x.stack || x && x.message || x)).join(' || ')); } catch (e) {} _ow(...a); };
        window.addEventListener('error', (e) => { try { window.__errs.push('WINDOW_ERROR: ' + (e.error && e.error.stack || e.message)); } catch (err) {} });
        window.addEventListener('unhandledrejection', (e) => { try { window.__errs.push('UNHANDLED: ' + (e.reason && e.reason.stack || String(e.reason))); } catch (err) {} });
        'ok';
    `, "hooks");

    // 清库从零开始
    await js(`
        (async () => {
            for (const n of ['hidden-progress-db', 'context_archive_db']) {
                try { await new Promise(r => { const q = indexedDB.deleteDatabase(n); q.onsuccess = r; q.onerror = r; q.onblocked = r; }); } catch {}
            }
            try { localStorage.clear(); } catch {}
            return 'cleared';
        })()
    `, "reset");
    await new Promise((r) => setTimeout(r, 1200));
    await win.webContents.reload();
    await new Promise((r) => setTimeout(r, 9000));

    // 开始 → 开场推进到表单（轮询式，稳）
    await js(`(() => { const b = [...document.querySelectorAll('button')].find(b => /开始/.test(b.innerText)); if (b) { b.click(); return 'start'; } return 'no-start'; })()`, "start");
    let dialogReady = false;
    for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        // 开场对白需要「点击画面」推进；表单弹出前每轮轻点一次屏幕中心（不再点跳过，避免误跳整段）
        const s = await js(`
            (() => {
                const inputs = document.querySelectorAll('input').length;
                if (inputs < 4) {
                    const t = document.elementFromPoint(innerWidth/2, innerHeight/2) || document.body;
                    ['pointerdown','pointerup'].forEach(et => t.dispatchEvent(new PointerEvent(et, { bubbles: true, pointerId: 1, clientX: innerWidth/2, clientY: innerHeight/2, button: 0 })));
                }
                return { inputs, url: location.href };
            })()
        `, "wait-dialog-" + i);
        if (s?.inputs >= 4) { dialogReady = true; console.log("DIALOG READY at", i, JSON.stringify(s)); break; }
    }
    if (!dialogReady) console.log("WARN: dialog not detected, will try fill anyway");
    await js(`
        (() => {
            const inputs = [...document.querySelectorAll('input')];
            const fill = (i, v) => { if (inputs[i]) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inputs[i], v); inputs[i].dispatchEvent(new Event('input', { bubbles: true })); } };
            fill(0, '测试者'); fill(1, '鲸鲸'); fill(2, 'sk-test'); fill(3, 'deepseek-chat');
            const ok = [...document.querySelectorAll('button')].find(b => /记下了|确认|记下/.test(b.innerText));
            if (ok) ok.click();
            return { filled: inputs.length };
        })()
    `, "fill");
    let reachedChat = false;
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        // 填表提交后仍有最后一句对白需点击推进；仅在「未进聊天页且表单已收起」时轻点屏幕中心
        const s = await js(`
            (() => {
                const inChat = !!document.querySelector('footer input');
                const inputs = document.querySelectorAll('input').length;
                if (!inChat && inputs < 4) {
                    const t = document.elementFromPoint(innerWidth/2, innerHeight/2) || document.body;
                    ['pointerdown','pointerup'].forEach(et => t.dispatchEvent(new PointerEvent(et, { bubbles: true, pointerId: 1, clientX: innerWidth/2, clientY: innerHeight/2, button: 0 })));
                }
                return { inChat, url: location.href };
            })()
        `, "wait-chat-" + i);
        if (i % 5 === 0) console.log("WAIT-CHAT", i, JSON.stringify(s));
        if (s?.inChat) { reachedChat = true; console.log("IN CHAT at", i); break; }
    }
    console.log("SETUP DONE:", JSON.stringify({ dialogReady, reachedChat }));
    if (!reachedChat) { console.log("ABORT: never reached chat"); win.destroy(); app.exit(1); return; }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const tap = `(() => { const t = document.elementFromPoint(innerWidth/2, innerHeight/2) || document.body; t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: innerWidth/2, clientY: innerHeight/2, button: 0 })); t.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: innerWidth/2, clientY: innerHeight/2, button: 0 })); return true; })()`;
    const readState = () =>
        js(`
        (async () => {
            const prog = await new Promise((res) => {
                try {
                    const req = indexedDB.open('hidden-progress-db', 1);
                    req.onsuccess = () => { const db = req.result; try { const tx = db.transaction('hidden-progress', 'readonly'); const g = tx.objectStore('hidden-progress').get('hidden-progress'); g.onsuccess = () => { db.close(); res(g.result?.progress ?? null); }; g.onerror = () => { db.close(); res(null); }; } catch (e) { db.close(); res(null); } };
                    req.onerror = () => res(null);
                } catch (e) { res(null); }
            });
            return {
                url: location.href,
                inChat: !!document.querySelector('footer input'),
                narration: !!document.querySelector('[data-slot="scroll-area-viewport"]'),
                badge: (() => { const d = [...document.querySelectorAll('div')].find(x => /隐藏剧情\\s*\\d/.test(x.innerText || '')); return d ? d.innerText.trim().slice(-3) : null; })(),
                exploreBtn: [...document.querySelectorAll('button')].map(x => x.innerText.trim()).find(x => /^探索/.test(x)) ?? null,
                prog: prog ? { seg: prog.segments, open: prog.exploreOpen, seq: prog.exploreSeq } : null,
            };
        })()
    `, "read-state");
    const sendWebMsg = (text) =>
        js(`
        (() => {
            const el = document.querySelector('footer input');
            if (!el) return 'no-input';
            const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            set.call(el, ${JSON.stringify(text)});
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const send = [...document.querySelectorAll('button')].find(b => /发送/.test(b.innerText));
            if (send) send.click();
            return 'sent';
        })()
    `, "send-msg");
    const clickRe = (reSrc, tag) =>
        js(`(() => { const b = [...document.querySelectorAll('button')].find(b => new RegExp(${JSON.stringify(reSrc)}).test(b.innerText)); if (b) { b.click(); return 'clicked:' + b.innerText.trim(); } return 'no-btn'; })()`, tag);

    // ── fresh 模式：复刻用户现场 ──
    if (SCEN.mode === "fresh") {
        console.log("== FRESH REPLAY: 首消息触发 ==");
        console.log("send#1:", JSON.stringify(await sendWebMsg("Claude图书馆借阅证")));
        let phase = null;
        for (let i = 0; i < 30; i++) {
            await sleep(700);
            const st = await readState();
            const apiReplied = await js(`(document.querySelector('#root')?.innerText || '').includes('（测试回复）')`, "api-check");
            if (i % 4 === 0) console.log("  first-probe", i, JSON.stringify(st).slice(0, 260), "apiReplied=" + apiReplied);
            if (st?.narration || st?.badge) { phase = "ENTERED"; console.log("  >>> S1-1 ENTERED at", i, JSON.stringify(st).slice(0, 220)); break; }
            if (apiReplied) { phase = "API_REPLY"; console.log("  >>> got API reply (NOT intercepted) at", i); break; }
        }
        if (!phase) {
            phase = "SWALLOWED";
            console.log("  >>> 第一发无演出、无API回复 → 疑似被吞，复刻重发");
            console.log("send#2:", JSON.stringify(await sendWebMsg("Claude图书馆借阅证")));
            for (let i = 0; i < 30; i++) {
                await sleep(700);
                const st = await readState();
                if (i % 4 === 0) console.log("  retry-probe", i, JSON.stringify(st).slice(0, 220));
                if (st?.narration || st?.badge) { phase = "ENTERED_ON_RETRY"; console.log("  >>> 第二发进入了 at", i); break; }
            }
        }
        console.log("PHASE1:", phase, "state:", JSON.stringify(await readState()).slice(0, 260));

        // 跳过 S1-1
        await sleep(800);
        console.log("click 跳过:", JSON.stringify(await clickRe("跳过", "skip")));
        for (let i = 0; i < 40; i++) {
            await sleep(700);
            const st = await readState();
            if (i % 5 === 0) console.log("  skip-wait", i, JSON.stringify(st).slice(0, 220));
            if (st?.inChat) { console.log("  >>> back to chat after skip at", i); break; }
        }
        console.log("AFTER S1-1:", JSON.stringify(await readState()).slice(0, 320));

        // 探索循环：探索 → 推进 → 回聊天 → 检查按钮/进度
        for (let n = 1; n <= 6; n++) {
            let clicked = "no-btn";
            for (let i = 0; i < 12; i++) {
                await sleep(600);
                const st = await readState();
                if (st?.exploreBtn) { clicked = await clickRe("^探索", "explore-" + n); break; }
                if (i === 11) console.log("  >>> 探索按钮消失（第 " + n + " 次前）:", JSON.stringify(st));
            }
            if (clicked === "no-btn") { console.log("  >>> STOP: 第 " + n + " 次找不到探索按钮"); break; }
            console.log("explore#" + n + " " + JSON.stringify(clicked));
            let endState = "timeout";
            for (let i = 0; i < 120; i++) {
                await sleep(300);
                const st = await readState();
                if (st?.inChat) { endState = "chat"; break; }
                await js(tap, "tap");
            }
            const st = await readState();
            console.log("  after explore#" + n, "end=" + endState, JSON.stringify({ url: st.url, open: st.prog?.open, seq: st.prog?.seq, seg: st.prog?.seg }).slice(0, 340));
            if (endState !== "chat") { console.log("  >>> 没回到聊天，卡住状态:", JSON.stringify(st).slice(0, 300)); break; }
        }
        console.log("FINAL STATE:", JSON.stringify(await readState(), null, 1).slice(0, 900));
        console.log("ERRS:", JSON.stringify(await js(`(window.__errs||[]).slice(-18)`, "errs-dump"), null, 1).slice(0, 1500));
        console.log("===== console logs tail =====");
        console.log(logs.slice(-18).join("\n"));
        win.destroy();
        app.exit(0);
        return;
    }

    // ── 注入进度：锚点段 played + 已探索 4 次（下一步点探索 = 第 5 段，正是衔接段）──
    const inj = await js(`
        (async () => {
            const locked = { "s1-1": "locked", "s1-2": "locked", "s1-3": "locked", "s2-1": "locked", "s2-2": "locked", "s2-3": "locked", "s3-1": "locked", "s3-2": "locked", "s3-3": "locked" };
            const prog = {
                segments: Object.assign(locked, ${JSON.stringify(SCEN.segments)}),
                exploreOpen: ${SCEN.exploreOpen === false ? "false" : "true"}, exploreSeq: ${JSON.stringify(SCEN.exploreSeq)}, version: 1
            };
            await new Promise((res, rej) => {
                const req = indexedDB.open('hidden-progress-db', 1);
                req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('hidden-progress')) db.createObjectStore('hidden-progress', { keyPath: 'id' }); };
                req.onsuccess = () => { const db = req.result; const tx = db.transaction('hidden-progress', 'readwrite'); tx.objectStore('hidden-progress').put({ id: 'hidden-progress', progress: prog }); tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; };
                req.onerror = () => rej(req.error);
            });
            window.dispatchEvent(new Event('gal:archive-changed'));
            return 'injected';
        })()
    `, "inject");
    console.log("INJECT:", JSON.stringify(inj));

    // ── entry 模式：直接发关键词，观测首次/二次触发 ──
    if (SCEN.mode === "entry") {
        const sendMsg = (text) =>
            js(`
            (() => {
                const el = document.querySelector('footer input') || [...document.querySelectorAll('input')].find(i => i.type !== 'password');
                if (!el) return 'no-input';
                const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                set.call(el, ${JSON.stringify(text)});
                el.dispatchEvent(new Event('input', { bubbles: true }));
                const send = [...document.querySelectorAll('button')].find(b => /发送|send/i.test(b.innerText));
                if (send) send.click();
                return 'sent';
            })()
        `, "send-msg");
        for (let attempt = 1; attempt <= 2; attempt++) {
            const snt = await sendMsg(SCEN.sendText);
            console.log(`ATTEMPT ${attempt} send:`, JSON.stringify(snt));
            let entered = false;
            for (let i = 0; i < 14; i++) {
                await new Promise((r) => setTimeout(r, 800));
                const st = await js(`(() => ({
                    inChat: !!document.querySelector('footer input'),
                    narration: !!document.querySelector('[data-slot="scroll-area-viewport"]'),
                    badge: (() => { const d = [...document.querySelectorAll('div')].find(x => /隐藏剧情\\s*\\d/.test(x.innerText || '')); return d ? d.innerText.trim().slice(-8) : null; })(),
                    apiReplied: (document.querySelector('#root')?.innerText || '').includes('（测试回复）'),
                }))()`, "entry-probe-" + attempt + "-" + i);
                if (i % 3 === 0) console.log(`  A${attempt} probe`, i, JSON.stringify(st));
                if (st?.narration || st?.badge) { entered = true; console.log(`>>> ATTEMPT ${attempt}: ENTERED at ${i}`, JSON.stringify(st)); break; }
                if (st?.apiReplied && i > 3) { console.log(`>>> ATTEMPT ${attempt}: got API reply (not intercepted) at ${i}`); break; }
            }
            if (entered) break;
            if (attempt === 1) console.log(">>> ATTEMPT 1 did NOT enter, retrying...");
        }
        await new Promise((r) => setTimeout(r, 1000));
        const dumpE = await js(`
            (async () => {
                const prog = await new Promise((res) => {
                    const req = indexedDB.open('hidden-progress-db', 1);
                    req.onsuccess = () => { const db = req.result; const tx = db.transaction('hidden-progress', 'readonly'); const g = tx.objectStore('hidden-progress').get('hidden-progress'); g.onsuccess = () => { db.close(); res(g.result?.progress ?? null); }; g.onerror = () => { db.close(); res(null); }; };
                    req.onerror = () => res(null);
                });
                return { url: location.href, inChat: !!document.querySelector('footer input'), badge: (() => { const d = [...document.querySelectorAll('div')].find(x => /隐藏剧情\\s*\\d/.test(x.innerText || '')); return d ? d.innerText.trim().slice(-8) : null; })(), progress: prog, errs: (window.__errs || []).slice(-15), txt: (document.querySelector('#root')?.innerText || '').replace(/\\n/g, '|').slice(0, 200) };
            })()
        `, "entry-dump");
        console.log("ENTRY DUMP:", JSON.stringify(dumpE, null, 1));
        console.log("===== console logs tail =====");
        console.log(logs.slice(-15).join("\n"));
        win.destroy();
        app.exit(0);
        return;
    }
    let hasExplore = false;
    for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const s = await js(`(() => ({ explore: [...document.querySelectorAll('button')].map(x => x.innerText.trim()).find(x => /探索/.test(x)) ?? null }))()`, "btn-" + i);
        if (s?.explore) { hasExplore = true; console.log("EXPLORE BTN:", s.explore, "at", i); break; }
    }
    if (!hasExplore) {
        const s = await js(`(() => ({ btns: [...document.querySelectorAll('button')].map(x => x.innerText.trim()).filter(Boolean).slice(-8), errs: (window.__errs||[]).slice(-5) }))()`, "no-btn-dump");
        console.log("NO EXPLORE BTN:", JSON.stringify(s));
    }
    const clicked = await js(`(() => { const b = [...document.querySelectorAll('button')].find(b => /探索/.test(b.innerText)); if (b) { b.click(); return 'clicked'; } return 'no-btn'; })()`, "click-explore");
    console.log("CLICK:", JSON.stringify(clicked));
    await new Promise((r) => setTimeout(r, 3000));

    // （tap / sleep / readState 已在前方统一声明，此处复用）

    let chainState = "unknown";
    for (let i = 0; i < 160; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const st = await js(`(() => ({
            inChat: !!document.querySelector('footer input'),
            narration: !!document.querySelector('[data-slot="scroll-area-viewport"]'),
            badge: (() => { const d = [...document.querySelectorAll('div')].find(x => /隐藏剧情\\s*\\d/.test(x.innerText || '')); return d ? d.innerText.trim().slice(0, 12) : null; })(),
            txt: (document.querySelector('#root')?.innerText || '').replace(/\\n/g, '|').slice(0, 70),
        }))()`, "probe-" + i);
        if (i % 8 === 0) console.log("PROBE", i, JSON.stringify(st));
        if (st?.inChat) { chainState = "BACK_TO_CHAT(no chain)"; console.log(">>> back to chat at iter", i); break; }
        if (st?.badge && st.badge.includes(SCEN.expectSeq)) { chainState = "CHAINED(" + SCEN.expectSeq + ")"; console.log(">>> chained, badge=", st.badge, "at iter", i); break; }
        await js(tap, "tap-" + i);
    }
    console.log("CHAIN RESULT:", chainState);

    await new Promise((r) => setTimeout(r, 1200));
    const dump = await js(`
        (async () => {
            const prog = await new Promise((res) => {
                const req = indexedDB.open('hidden-progress-db', 1);
                req.onsuccess = () => { const db = req.result; const tx = db.transaction('hidden-progress', 'readonly'); const g = tx.objectStore('hidden-progress').get('hidden-progress'); g.onsuccess = () => { db.close(); res(g.result?.progress ?? null); }; g.onerror = () => { db.close(); res(null); }; };
                req.onerror = () => res(null);
            });
            return { url: location.href, inChat: !!document.querySelector('footer input'), narration: !!document.querySelector('[data-slot="scroll-area-viewport"]'), progress: prog, errs: (window.__errs || []).slice(-15) };
        })()
    `, "dump");
    console.log("DUMP:", JSON.stringify(dump, null, 1));
    console.log("===== console logs tail =====");
    console.log(logs.slice(-25).join("\n"));

    win.destroy();
    app.exit(0);
}).catch((e) => { console.log("FATAL:", e); app.exit(1); });