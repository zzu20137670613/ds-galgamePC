import { app, BrowserWindow, ipcMain, net } from "electron";
import { join, dirname, extname } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ⚠⚠ 测试壳必须使用【独立 userData 目录】：与用户实际安装的游戏共用 %APPDATA%\deepseek-gal 时，
// 本脚本的 indexedDB.deleteDatabase / localStorage.clear 会清掉/锁住用户正在运行的游戏状态
//（2026-10-07 事故教训：触发词"被吃"、探索按钮消失"像点了退出"）。
app.setPath("userData", join(app.getPath("temp"), "gal-hiddentest-userdata"));

// 测试壳禁用 ServiceWorker，避免 PWA 缓存残留干扰
app.commandLine.appendSwitch("disable-features", "ServiceWorker");

// 测试专属记忆目录（避免污染正式 whale-memory）
const TEST_MEMORY_DIR = join(app.getPath("userData"), "whale-memory-test");
const TEST_CONV = join(TEST_MEMORY_DIR, "conversation.json");
const TEST_MEM = join(TEST_MEMORY_DIR, "memories.json");
function tRead(f) {
    if (!existsSync(f)) return null;
    try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return null; }
}
function tWrite(f, d) {
    mkdirSync(TEST_MEMORY_DIR, { recursive: true });
    writeFileSync(f, JSON.stringify(d, null, 2), "utf-8");
}
function resetTestData() {
    try { rmSync(TEST_MEMORY_DIR, { recursive: true, force: true }); } catch (e) {}
}

ipcMain.handle("archive:loadAll", () => tRead(TEST_CONV)?.messages ?? []);
ipcMain.handle("archive:append", (_e, message) => {
    const record = tRead(TEST_CONV) ?? {};
    const incoming = Array.isArray(message) ? message : [message];
    tWrite(TEST_CONV, { messages: [...(record.messages ?? []), ...incoming] });
    return true;
});
ipcMain.handle("memory:loadAll", () => tRead(TEST_MEM)?.memories ?? []);
ipcMain.handle("memory:save", (_e, memories) => {
    tWrite(TEST_MEM, { memories });
    return true;
});
// 测试用假 API：不真正请求，避免测试期间浪费 key
ipcMain.handle("api:chat", async (_e, payload) => {
    return { ok: true, status: 200, data: { choices: [{ message: { content: "（测试回复）我知道你说的这件事，不过我们换个别的话题聊聊吧。" } }] } };
});

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json; charset=utf-8",
};

app.whenReady().then(async () => {
    resetTestData();
    const distDir = join(__dirname, "../dist");
    const server = createServer((req, res) => {
        const url = new URL(req.url, "http://127.0.0.1");
        let pathname = decodeURIComponent(url.pathname);
        if (pathname === "/" || pathname === "") pathname = "/index.html";
        const filePath = join(distDir, pathname);
        if (!existsSync(filePath)) {
            res.writeHead(404).end("Not Found");
            return;
        }
        const ext = extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(readFileSync(filePath));
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const port = server.address().port;

    const win = new BrowserWindow({
        width: 1280, height: 800, show: false,
        webPreferences: {
            preload: join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const logs = [];
    win.webContents.on("console-message", (_e, level, message, line, sourceId) => {
        logs.push(`[L${level}] ${message} (${sourceId}:${line})`);
    });
    win.webContents.on("render-process-gone", (_e, details) => {
        logs.push(`[GONE] ${details.reason}`);
    });
    win.webContents.on("did-start-navigation", (_e, url, isInPlace, isMainFrame) => {
        logs.push(`[NAV] ${url} inPlace=${isInPlace} main=${isMainFrame} t=${Date.now() % 100000}`);
    });

    await win.loadURL(`http://127.0.0.1:${port}/`);
    await new Promise((r) => setTimeout(r, 9000));

    const js = async (code, tag) => {
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                return await win.webContents.executeJavaScript(code);
            } catch (err) {
                console.log(`[STEP_FAIL] ${tag} attempt=${attempt}:`, String(err?.stack || err).split("\n").slice(0, 3).join(" | "));
                await new Promise((r) => setTimeout(r, 1500));
            }
        }
        return { EXEC_FAILED: tag };
    };

    // 捕获页面错误
    await js(`
        window.__errs = [];
        const _oe = console.error.bind(console);
        console.error = (...a) => { try { window.__errs.push(a.map(x => String(x && x.stack || x && x.message || x)).join('  ||  ')); } catch (e) {} _oe(...a); };
        window.addEventListener('error', (e) => { try { window.__errs.push('WINDOW_ERROR: ' + (e.error && e.error.stack || e.message)); } catch (err) {} });
        window.addEventListener('unhandledrejection', (e) => { try { window.__errs.push('UNHANDLED_REJECTION: ' + (e.reason && e.reason.stack || String(e.reason))); } catch (err) {} });
        // 剧情推进 tap：NarrationCards 的 goNext 挂载在 HTML 层 ScrollArea 上（不在 canvas）。
        // 对 ScrollArea 派发 pointerdown+pointerup 触发推进；没有 ScrollArea 时退回点击中央元素。
        window.__tapAdvance = () => {
            const area = document.querySelector('[data-slot="scroll-area-viewport"]');
            const target = area || document.querySelector('canvas') || document.body;
            const r = target.getBoundingClientRect();
            const cx = r.left + r.width/2, cy = r.top + r.height/2;
            target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
            target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
            target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
            return !!area;
        };
        'installed';
    `, "hook");

    // 重置 IndexedDB 隐藏进度/上下文，保证从零开始
    await js(`
        (async () => {
            const names = ['hidden-progress-db', 'context_archive_db'];
            for (const n of names) { try { await new Promise(r => { const q = indexedDB.deleteDatabase(n); q.onsuccess = r; q.onerror = r; q.onblocked = r; }); } catch (e) {} }
            try { localStorage.clear(); } catch (e) {}
            return 'cleared';
        })()
    `, "reset-idb");
    await new Promise((r) => setTimeout(r, 1500));

    // 重新加载，让清库生效
    await win.webContents.reload();
    await new Promise((r) => setTimeout(r, 9000));

    // ── 步骤 1：点「开始」进入开场 ──
    await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')];
            const start = btns.find(b => /开始/.test(b.innerText));
            if (start) { start.click(); return 'clicked-start'; }
            return 'no-start-btn: ' + btns.map(b => b.innerText.trim()).join('|');
        })()
    `, "start-click");
    await new Promise((r) => setTimeout(r, 5000));

    // ── 步骤 2：推进对话直到输入表单弹出 ──
    // 开场 start label 的台词推进用「跳过」按钮最稳（SkipSettings 会开启，但马上会 reload 复位）
    let dialogAppeared = false;
    for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 800));
        const s = await js(`
            (() => {
                const btns = [...document.querySelectorAll('button')];
                const skip = btns.find(b => /跳过|快进|skip/i.test(b.innerText));
                if (skip) skip.click();
                else {
                    const canvas = document.querySelector('canvas');
                    if (canvas) { const r = canvas.getBoundingClientRect(); canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: r.width/2, clientY: r.height/2 })); canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.width/2, clientY: r.height/2 })); }
                }
                return { inputs: document.querySelectorAll('input').length, dialog: !!document.querySelector('[role="dialog"]') };
            })()
        `, "advance-" + i);
        if (s?.inputs >= 4 || s?.dialog) { dialogAppeared = true; console.log("DIALOG_APPEARED at iter", i); break; }
    }

    // ── 步骤 3：填设定表单并提交 → 进入聊天页 ──
    await js(`
        (() => {
            const inputs = [...document.querySelectorAll('input')];
            const fill = (idx, val) => { if (inputs[idx]) { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inputs[idx], val); inputs[idx].dispatchEvent(new Event('input', { bubbles: true })); } };
            fill(0, '测试者'); fill(1, '鲸鲸'); fill(2, 'sk-test-123'); fill(3, 'deepseek-chat');
            const btns = [...document.querySelectorAll('button')];
            const ok = btns.find(b => /记下了|确认|记下/.test(b.innerText));
            if (ok) ok.click();
            return 'submitted';
        })()
    `, "fill-submit");
    await new Promise((r) => setTimeout(r, 5000));

    // 提交后等待其进入聊天页（onEnd → /game/chat），不做 reload（SkipSettings 是内存态，
    // 跳过一次后会被长按检测/再次点击复位；隐藏演出前显式关闭它更可控）
    await new Promise((r) => setTimeout(r, 3000));

    const s1 = await js(`
        (() => ({ url: location.href, rootText: (document.querySelector('#root')?.innerText || '').slice(0, 120), inputs: document.querySelectorAll('footer input').length }))()
    `, "after-submit");
    console.log("S1 提交后:", JSON.stringify(s1));
    await new Promise((r) => setTimeout(r, 2000));
    const s2 = await js(`
        (() => ({ url: location.href, inChat: !!document.querySelector('footer input') }))()
    `, "chat-check");
    console.log("S2 聊天页:", JSON.stringify(s2));

    // ── 步骤 4：发送 S1-1 触发句（双词：图书馆+借阅证）→ 应拦截、跳全屏演出 ──
    await js(`
        (() => {
            const el = document.querySelector('footer input') || [...document.querySelectorAll('input')].find(i => i.type !== 'password');
            if (!el) return 'no-input';
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, '我想去图书馆办一张借阅证，找回被划掉的名字。');
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const send = [...document.querySelectorAll('button')].find(b => /发送|send/i.test(b.innerText));
            if (send) send.click();
            return 'sent-trigger';
        })()
    `, "send-trigger");
    // 演出阶段细粒度观察：发送后 1.5s / 3s / 4.5s 快照（单次尝试，不重试，避免时间线拉乱）
    for (const wait of [1500, 1500, 1500]) {
        await new Promise((r) => setTimeout(r, wait));
        let snap = null;
        try {
            snap = await win.webContents.executeJavaScript(`
                (() => {
                    try { return { url: location.href, rootText: (document.querySelector('#root')?.innerText || '').slice(0, 60).replace(/\n/g, '|') }; }
                    catch (e) { return { err: String(e) }; }
                })()
            `);
        } catch (e) { snap = { navError: String(e).slice(0, 80) }; }
        console.log("SNAP:", JSON.stringify(snap));
    }
    const s3 = await js(`
        (() => ({ url: location.href, canvases: document.querySelectorAll('canvas').length, rootText: (document.querySelector('#root')?.innerText || '').slice(0, 200), badge: !!document.querySelector('div') && [...document.querySelectorAll('div')].some(d => /隐藏剧情/.test(d.innerText)) }))()
    `, "trigger-check");
    console.log("S3 触发后:", JSON.stringify(s3));

    // ── 步骤 5：推进全屏演出直到回到聊天页 ──
    // 先探测 ScrollArea 的屏幕坐标（NarrationCards 的 goNext 挂在这上面），再用真实鼠标点击推进
    const areaPos = await js(`
        (() => {
            try {
                const area = document.querySelector('[data-slot="scroll-area-viewport"]');
                if (!area) return null;
                const r = area.getBoundingClientRect();
                return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), w: Math.round(r.width), h: Math.round(r.height) };
            } catch (e) { return { err: String(e) }; }
        })()
    `, "area-pos");
    console.log("AREA-POS:", JSON.stringify(areaPos));
    const tapX = (areaPos && areaPos.x) || 640;
    const tapY = (areaPos && areaPos.y) || 400;
    let backToChat = false;
    for (let i = 0; i < 220; i++) {
        await new Promise((r) => setTimeout(r, 200));
        // 直接对推进层派发合成 pointer 事件：NarrationClickOverlay 是 fixed inset-0 z-0 的全屏层
        await js(`
            (() => {
                const rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
                const cx = rect.width/2, cy = rect.height/2;
                const target = document.elementFromPoint(cx, cy);
                const evtTarget = target || document.body;
                evtTarget.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
                evtTarget.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
                return { tag: target ? target.tagName : 'none', cls: target ? String(target.className).slice(0, 40) : '', hasArea: !!document.querySelector('[data-slot="scroll-area-viewport"]'), hasOverlay: !!document.querySelector('[data-slot="scroll-area-viewport"]') };
            })()
        `, "tap-" + i);
        if (i % 5 === 0) {
            const st = await js(`
                (() => { try { return { url: location.href, inChat: !!document.querySelector('footer input') }; } catch (e) { return { err: String(e) }; } })()
            `, "play-check-" + i);
            console.log("PLAY-CHECK", i, JSON.stringify(st));
            if (st?.inChat) { backToChat = true; console.log("PLAY_ENDED back to chat at iter", i); break; }
        }
    }
    console.log("S4 演出结束回聊天:", JSON.stringify({ backToChat }));

    // ── 步骤 6：验证探索按钮出现（0/5）──
    const s5 = await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim());
            return { btns: btns.filter(Boolean).slice(-6), exploreVisible: btns.some(b => /探索星海图书馆/.test(b)) };
        })()
    `, "explore-btn-check");
    console.log("S5 探索按钮:", JSON.stringify(s5));

    // ── 步骤 7：点【探索】1 次 → 演出小剧情 → 回到聊天 → 计数 1/5 ──
    await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')];
            const exp = btns.find(b => /探索星海图书馆/.test(b.innerText));
            if (exp) { exp.click(); return 'clicked-explore'; }
            return 'no-explore-btn';
        })()
    `, "click-explore");
    await new Promise((r) => setTimeout(r, 5000));
    for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 200));
        await js(`
            (() => {
                const rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
                const cx = rect.width/2, cy = rect.height/2;
                const target = document.elementFromPoint(cx, cy) || document.body;
                target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
                target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: cx, clientY: cy, button: 0 }));
                return true;
            })()
        `, "tap-explore-" + i);
        if (i % 5 === 0) {
            const st = await js(`
                (() => { try { return { inChat: !!document.querySelector('footer input') }; } catch (e) { return { err: String(e) }; } })()
            `, "explore-check-" + i);
            if (st?.inChat) { console.log("EXPLORE_ENDED at iter", i); break; }
        }
    }
    const s6 = await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
            return { btns: btns.slice(-6), exploreText: btns.find(b => /探索星海图书馆/.test(b)), errs: (window.__errs || []).slice(-5) };
        })()
    `, "explore-progress-check");
    console.log("S6 探索后计数:", JSON.stringify(s6));

    // ── 步骤 8：点【退出】→ 按钮应消失 ──
    await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')];
            const exit = btns.find(b => /退出星海图书馆/.test(b.innerText));
            if (exit) { exit.click(); return 'clicked-exit'; }
            return 'no-exit-btn';
        })()
    `, "click-exit");
    await new Promise((r) => setTimeout(r, 1500));
    const s7 = await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
            return { exploreGone: !btns.some(b => /探索星海图书馆/.test(b)) };
        })()
    `, "exit-check");
    console.log("S7 退出后:", JSON.stringify(s7));

    // ── 步骤 9：再发锚点段关键词（S1-1 双词）→ 探索按钮应重新出现（explore 分支，照常发 API，假 API 会回）──
    await js(`
        (() => {
            const el = document.querySelector('footer input');
            if (!el) return 'no-input';
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, '再跟我讲讲图书馆里的借阅证吧。');
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const send = [...document.querySelectorAll('button')].find(b => /发送|send/i.test(b.innerText));
            if (send) send.click();
            return 'sent-anchor';
        })()
    `, "send-anchor");
    await new Promise((r) => setTimeout(r, 8000));
    const s8 = await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
            return { exploreBack: btns.some(b => /探索星海图书馆/.test(b)), exploreText: btns.find(b => /探索星海图书馆/.test(b)), errs: (window.__errs || []).slice(-5) };
        })()
    `, "anchor-reopen-check");
    console.log("S8 重新触发探索:", JSON.stringify(s8));

    console.log("===== ERRORS (前 10 条) =====");
    console.log((await js(`(window.__errs || []).slice(0, 10)`, "errs-dump")) || []);
    console.log("===== LOGS (后 30 条) =====");
    console.log(logs.slice(-30).join("\n"));

    win.destroy();
    app.exit(0);
});