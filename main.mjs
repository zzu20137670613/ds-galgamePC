import { app, BrowserWindow, ipcMain, net, protocol } from "electron";
import { join, dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// 注册自定义协议 app://（必须在 app ready 之前）
// 页面用 app://bundle/index.html 加载，这样 Pixi/React 里的绝对路径
// （如 /backgrounds/main-menu.jpg）会解析为 app://bundle/backgrounds/...，
// 由下方 protocol.handle 映射到 dist 目录，避免 file:// 下绝对路径指向磁盘根。
protocol.registerSchemesAsPrivileged([
    {
        scheme: "app",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
        },
    },
]);

/**
 * 记忆文件夹：位于系统用户数据目录的专属文件夹 whale-memory/，
 * 只存放 conversation.json（全量上下文）与 memories.json（挑选保留的记忆），
 * 不与任何其他游戏数据混杂。
 *
 * ★ 卸载保留约束：默认位于 app.getPath("userData") 下，
 *   electron-builder 默认不删除 userData（deleteAppDataOnUninstall 保持 false），
 *   因此卸载 exe 后该文件夹及其中的记忆会原样保留。
 */
const MEMORY_DIR = join(app.getPath("userData"), "whale-memory");
const CONVERSATION_FILE = join(MEMORY_DIR, "conversation.json");
const MEMORIES_FILE = join(MEMORY_DIR, "memories.json");

function ensureMemoryDir() {
    mkdirSync(MEMORY_DIR, { recursive: true });
}

/** 读取 JSON 文件；文件不存在返回 null */
function readJson(file) {
    if (!existsSync(file)) return null;
    try {
        return JSON.parse(readFileSync(file, "utf-8"));
    } catch (e) {
        console.error(`读取 ${file} 失败`, e);
        return null;
    }
}

function writeJson(file, data) {
    ensureMemoryDir();
    writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ── IPC：上下文存档（全量对话） ─────────────────────────────
ipcMain.handle("archive:loadAll", () => {
    const record = readJson(CONVERSATION_FILE);
    return record?.messages ?? [];
});

ipcMain.handle("archive:append", (_e, message) => {
    const record = readJson(CONVERSATION_FILE) ?? {};
    const incoming = Array.isArray(message) ? message : [message];
    const next = [...(record.messages ?? []), ...incoming];
    writeJson(CONVERSATION_FILE, { messages: next });
    return true;
});

// ── IPC：记忆存档（挑选保留的记忆） ──────────────────────────
ipcMain.handle("memory:loadAll", () => {
    const record = readJson(MEMORIES_FILE);
    return record?.memories ?? [];
});

ipcMain.handle("memory:save", (_e, memories) => {
    writeJson(MEMORIES_FILE, { memories });
    return true;
});

// ── IPC：大模型 API 请求（主进程转发，Electron 下无 CORS 限制） ──
ipcMain.handle("api:chat", async (_e, payload) => {
    const apiKey = payload.apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
        return { ok: false, status: 401, data: { error: { message: "未配置 API Key" } } };
    }
    try {
        const res = await net.fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        return { ok: false, status: 0, error: String(err) };
    }
});

// ── 窗口 ────────────────────────────────────────────────────
// file:// 协议下 Service Worker 不可用，拦截 registerSW.js 让其静默跳过
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 640,
        title: "DeepSeek Galgame",
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // 拦截 registerSW.js / sw.js / workbox 相关请求 → 直接返回空，避免 app:// 下 SW 注册报错
    win.webContents.session.webRequest.onBeforeRequest(
        { urls: ["app://*/*.js"] },
        (details, callback) => {
            if (/registerSW\.js$|(^|\/)sw\.js$|workbox-.*\.js$/.test(details.url)) {
                callback({ cancel: true });
                return;
            }
            callback({ cancel: false });
        },
    );

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        // 通过自定义 app:// 协议加载，资源绝对路径会正确映射到 dist 目录
        win.loadURL("app://bundle/index.html");
    }
    return win;
}

app.whenReady().then(() => {
    ensureMemoryDir();

    // app:// 协议 → dist 目录（生产模式游戏资源路由）
    const distDir = join(__dirname, "../dist");
    protocol.handle("app", (request) => {
        const url = new URL(request.url);
        // app://bundle/index.html → /index.html；绝对资源路径如 /backgrounds/a.jpg 直接映射
        let pathname = decodeURIComponent(url.pathname);
        if (pathname === "/" || pathname === "") pathname = "/index.html";
        // 防目录穿越：只允许 dist 下的文件
        const filePath = join(distDir, pathname);
        if (!filePath.startsWith(distDir)) {
            return new Response("Not Found", { status: 404 });
        }
        return net.fetch(pathToFileURL(filePath).toString());
    });

    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});