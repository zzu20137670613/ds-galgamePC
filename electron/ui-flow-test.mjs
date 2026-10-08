import { app, BrowserWindow, ipcMain, net } from "electron";
import { join, dirname, extname } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ⚠⚠ 测试壳必须使用【独立 userData 目录】，避免与用户实际安装的游戏共用状态（2026-10-07 事故教训）
app.setPath("userData", join(app.getPath("temp"), "gal-uiflow-userdata"));

// 测试壳禁用 ServiceWorker，避免 PWA 缓存残留干扰（每次测试端口/资源哈希都变，容易新旧错配）
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
// 与 main.mjs 一致的 IPC handler（测试壳自给自足）
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
ipcMain.handle("api:chat", async (_e, payload) => {
    const apiKey = payload.apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) return { ok: false, status: 401, data: { error: { message: "未配置 API Key" } } };
    try {
        const res = await net.fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        return { ok: false, status: 0, error: String(err) };
    }
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

// 用 Electron 壳加载 dist 静态服务器（与 exe 完全一致），跑真实 UI 流程：点开始 → 填表 → 提交
app.whenReady().then(async () => {
    // 主进程侧解析真实 key（页面上下文没有 process，不能在里面引用 env）
    const TEST_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-test-123";
    const distDir = join(__dirname, "../dist");
    const server = createServer((req, res) => {
        const url = new URL(req.url, "http://127.0.0.1");
        let pathname = decodeURIComponent(url.pathname);
        if (pathname === "/" || pathname === "") pathname = "/index.html";
        const filePath = join(distDir, pathname);
        if (!existsSync(filePath)) {
            console.log("HTTP404:", req.url);
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

    await win.loadURL(`http://127.0.0.1:${port}/`);
    // 等引擎 + React 挂载 + 场景加载
    await new Promise((r) => setTimeout(r, 9000));

    // executeJavaScript 带重试的封装：某步失败不中断整个流程
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

    // monkey-patch console.error / console.warn 抓完整错误堆栈（ErrorBoundary 的错误也会走 console.error）
    await js(`
        window.__errs = [];
        const _oe = console.error.bind(console);
        console.error = (...a) => {
            try { window.__errs.push(a.map(x => (x && x.stack) || (x && x.message) ? (x.stack || x.message) : String(x)).join('  ||  ')); } catch (e) {}
            _oe(...a);
        };
        window.addEventListener('error', (e) => { try { window.__errs.push('WINDOW_ERROR: ' + (e && e.error && e.error.stack) + ' || ' + (e && e.message)); } catch (err) {} });
        window.addEventListener('unhandledrejection', (e) => { try { window.__errs.push('UNHANDLED_REJECTION: ' + (e.reason && e.reason.stack) + ' || ' + String(e.reason && e.reason.message)); } catch (err) {} });
        'installed';
    `, "hook");
    console.log("HOOK_INSTALLED");

    const state = await js(`
        (() => ({
            url: location.href,
            root: (document.querySelector('#root')?.innerText || '').slice(0, 150),
            canvases: document.querySelectorAll('canvas').length,
            dialogBtn: [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean).slice(0, 10),
        }))()
    `, "state");
    console.log("STATE:", JSON.stringify(state));

    // 尝试点击「开始」
    await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')];
            const start = btns.find(b => /开始/.test(b.innerText));
            if (start) { start.click(); return 'clicked-start'; }
            return 'no-start-btn: ' + btns.map(b => b.innerText.trim()).join('|');
        })()
    `, "start-click");
    await new Promise((r) => setTimeout(r, 5000));
    logs.push("--- after start click ---");

    // 推进对话：先点「跳过/快进」类按钮，不行再 pointerdown canvas，直到输入表单弹出
    let dialogAppeared = false;
    for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 800));
        const s = await js(`
            (() => {
                // 找跳过类按钮
                const btns = [...document.querySelectorAll('button')];
                const skip = btns.find(b => /跳过|快进|skip/i.test(b.innerText));
                if (skip) skip.click();
                else {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        const rect = canvas.getBoundingClientRect();
                        canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: rect.width/2, clientY: rect.height/2 }));
                        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.width/2, clientY: rect.height/2 }));
                    }
                }
                return {
                    inputs: document.querySelectorAll('input').length,
                    dialog: !!document.querySelector('[role="dialog"]'),
                    text: (document.querySelector('#root')?.innerText || '').slice(0, 60),
                };
            })()
        `, "advance-" + i);
        if (s?.inputs >= 4 || s?.dialog) { dialogAppeared = true; console.log("DIALOG_APPEARED at iter", i, JSON.stringify(s)); break; }
        console.log("advance", i, JSON.stringify(s));
    }

    const state2 = await js(`
        (() => ({
            inputs: [...document.querySelectorAll('input')].map(i => i.placeholder || i.type).filter(Boolean),
            dialogVisible: !!document.querySelector('[role="dialog"]'),
            rootLen: (document.querySelector('#root')?.innerText || '').length,
            rootSnippet: (document.querySelector('#root')?.innerText || '').slice(0, 300),
        }))()
    `, "state2");
    console.log("STATE2:", JSON.stringify(state2));

    // 填表单：名字 + 鲸名 + API + 模型
    await js(`
        (() => {
            const inputs = [...document.querySelectorAll('input')];
            // 找到四个输入框，按其可识别特征填值
            const fill = (idx, val) => { if (inputs[idx]) { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inputs[idx], val); inputs[idx].dispatchEvent(new Event('input', { bubbles: true })); } };
            fill(0, '测试者');
            fill(1, '鲸鲸');
            fill(2, ${JSON.stringify(TEST_API_KEY)});
            fill(3, 'deepseek-chat');
            return 'filled ' + inputs.length + ' inputs';
        })()
    `, "fill");
    await new Promise((r) => setTimeout(r, 500));

    // 点「记下了」
    await js(`
        (() => {
            const btns = [...document.querySelectorAll('button')];
            const ok = btns.find(b => /记下了|确认|记下/.test(b.innerText));
            if (ok) { ok.click(); return 'clicked-ok'; }
            return 'no-ok-btn: ' + btns.map(b => b.innerText.trim()).join('|');
        })()
    `, "ok");
    await new Promise((r) => setTimeout(r, 4000));
    logs.push("--- after submit ---");

    const state3 = await js(`
        (() => ({
            url: location.href,
            rootLen: (document.querySelector('#root')?.innerText || '').length,
            rootText: (document.querySelector('#root')?.innerText || '').slice(0, 300),
        }))()
    `, "state3");
    console.log("STATE3:", JSON.stringify(state3));

    // 再等一下，观察 /game/chat 渲染是否稳定
    await new Promise((r) => setTimeout(r, 3000));
    const state4 = await js(`
        (() => ({
            url: location.href,
            errs: (window.__errs || []) .slice(-15),
            rootLen: (document.querySelector('#root')?.innerText || '').length,
            rootText: (document.querySelector('#root')?.innerText || '').slice(0, 600),
        }))()
    `, "state4");
    console.log("STATE4:", JSON.stringify(state4));

    // ── 输入框命中诊断：点输入框中心，看最顶层元素是谁、disabled 状态、能否聚焦 ──
    const diag = await js(`
        (() => {
            const dump = [];
            document.querySelectorAll('body > *, #root > *, #HTML_CANVAS_LAYER_NAME, #HTML_UI_LAYER_NAME, canvas, main, section').forEach(el => {
                const s = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                dump.push([el.tagName + (el.id ? '#' + el.id : ''), 'pos=' + s.position, 'pe=' + s.pointerEvents, 'z=' + s.zIndex, 'r=' + [r.x, r.y, r.width, r.height].map(v => Math.round(v)).join('x')].join(' '));
            });
            const input = document.querySelector('footer input, footer textarea, [placeholder*="说点什么"]');
            if (!input) return { dump, noInput: true };
            const r = input.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const top = document.elementFromPoint(cx, cy);
            return {
                dump: dump.slice(0, 40),
                inputTag: input.tagName,
                disabled: input.disabled,
                topAtCenter: top ? [top.tagName, top.id, top.className].filter(Boolean).join('.') : null,
            };
        })()
    `, "diag");
    console.log("DIAG:", JSON.stringify(diag));

    // 真实鼠标点击 + 键盘注入：模拟用户点击输入框并打字
    const inpPos = await js(`
        (() => {
            const el = document.querySelector('footer input');
            if (!el) return null;
            el.value = '';
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
        })()
    `, "inp-pos");
    if (inpPos && inpPos.x !== undefined) {
        win.webContents.sendInputEvent({ type: "mouseDown", x: inpPos.x, y: inpPos.y, button: "left", clickCount: 1 });
        win.webContents.sendInputEvent({ type: "mouseUp", x: inpPos.x, y: inpPos.y, button: "left", clickCount: 1 });
        await new Promise((r) => setTimeout(r, 400));
        win.webContents.sendInputEvent({ type: "char", keyCode: "h" });
        win.webContents.sendInputEvent({ type: "char", keyCode: "i" });
        await new Promise((r) => setTimeout(r, 600));
        const typed = await js(`
            (() => {
                const el = document.querySelector('footer input');
                return { value: el ? el.value : null, focused: el ? document.activeElement === el : false };
            })()
        `, "typed-check");
        console.log("TYPED:", JSON.stringify(typed));
    } else {
        console.log("TYPED: no input pos", JSON.stringify(inpPos));
    }

    // 发一条真实消息，验证 IPC → DeepSeek API → 回复渲染链路
    await js(`
        (() => {
            const el = document.querySelector('textarea') || document.querySelector('input[type="text"]') || [...document.querySelectorAll('input')].find(i => i.type !== 'password');
            if (!el) return 'no-input-el: ' + [...document.querySelectorAll('textarea, input')].map(e => e.tagName + ':' + (e.type || '') + ':' + (e.placeholder || '')).join('|');
            const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, '你好，鲸鲸。');
            el.dispatchEvent(new Event('input', { bubbles: true }));
            const send = [...document.querySelectorAll('button')].find(b => /发送|send/i.test(b.innerText));
            if (send) { send.click(); return 'sent:' + el.tagName; }
            return 'no-send-btn: ' + [...document.querySelectorAll('button')].map(b => b.innerText.trim()).join('|');
        })()
    `, "send");
    await new Promise((r) => setTimeout(r, 25000));
    const state5 = await js(`
        (() => ({
            url: location.href,
            errs: (window.__errs || []).slice(-8),
            rootText: (document.querySelector('#root')?.innerText || '').slice(0, 800),
        }))()
    `, "state5");
    console.log("STATE5:", JSON.stringify(state5));

    console.log("===== LOGS =====");
    console.log(logs.join("\n"));

    win.destroy();
    app.exit(0);
});