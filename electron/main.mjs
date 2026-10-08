import { app, BrowserWindow, ipcMain, net } from "electron";
import { join, dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

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
const CONVERSATION_MD_FILE = join(MEMORY_DIR, "conversation.md");
const CONVERSATION_TXT_FILE = join(MEMORY_DIR, "conversation.txt");
const MEMORIES_FILE = join(MEMORY_DIR, "memories.json");
const SEAL_MANIFEST_FILE = join(MEMORY_DIR, "seal-manifest.json");

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

/** 最近一次归档时见到的鲸鱼娘昵称（以用户设定名为准，避免兜底猜名字） */
let lastKnownWhaleName = "";

/**
 * 把全量对话序列化成人可直接翻阅的文本（md/txt 两种，内容同一份）。
 * 参照「芽衣」的存档习惯：json 给程序读，md/txt 给人在文件夹里直接打开看。
 * 格式：**说话人：** + 时间 + 内容。
 */
function messagesToReadable(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return "# 与鲸鱼娘的对话记录\n\n（还没有对话）\n";
    }
    const fmtTime = (ts) => {
        if (!ts) return "";
        const d = new Date(ts);
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    const lines = ["# 与鲸鱼娘的对话记录", ""];
    for (const m of messages) {
        // 说话人优先用消息自带的 character（renderer 已按用户设定名写入），
        // 缺失时才退到最近记住的名字，最后才是通用兜底。
        const who = m.role === "user" ? "用户" : m.character || lastKnownWhaleName || "鲸鱼娘";
        const time = fmtTime(m.ts);
        lines.push(`**${who}：**${time ? `  <small>${time}</small>` : ""}`, "");
        lines.push(m.content ?? "", "", "---", "");
    }
    return lines.join("\n");
}

/** 同步生成 md/txt 的人读镜像（与 json 全量一致，覆盖式重写） */
function syncReadableMirrors(messages) {
    ensureMemoryDir();
    const text = messagesToReadable(messages);
    writeFileSync(CONVERSATION_MD_FILE, text, "utf-8");
    writeFileSync(CONVERSATION_TXT_FILE, text.replace(/\*\*(.+?)：\*\*/g, "$1：").replace(/  <small>(.+?)<\/small>/g, "（$1）"), "utf-8");
}

// ── IPC：上下文存档（全量对话） ─────────────────────────────
ipcMain.handle("archive:loadAll", () => {
    const record = readJson(CONVERSATION_FILE);
    return record?.messages ?? [];
});

ipcMain.handle("archive:append", (_e, message) => {
    const record = readJson(CONVERSATION_FILE) ?? {};
    const incoming = Array.isArray(message) ? message : [message];
    // 记录最近一次见到的鲸鱼娘昵称（以用户设定名为准）
    for (const m of incoming) {
        if (m && m.role === "assistant" && m.character) lastKnownWhaleName = m.character;
    }
    const next = [...(record.messages ?? []), ...incoming];
    writeJson(CONVERSATION_FILE, { messages: next });
    syncReadableMirrors(next); // 每次追加后同步刷新人读的 md/txt
    return true;
});

// 清空全部上下文（主菜单「开始」= 全新开新档时调用）
ipcMain.handle("archive:reset", () => {
    writeJson(CONVERSATION_FILE, { messages: [] });
    syncReadableMirrors([]);
    return true;
});

// 整体替换上下文（读档恢复对话快照时调用）
ipcMain.handle("archive:replaceAll", (_e, messages) => {
    const list = Array.isArray(messages) ? messages : [];
    for (const m of list) {
        if (m && m.role === "assistant" && m.character) lastKnownWhaleName = m.character;
    }
    writeJson(CONVERSATION_FILE, { messages: list });
    syncReadableMirrors(list);
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

// ── IPC：封卷存档（结档产出的场景数据 + 游戏映射层） ──────────
// 文件名固定格式 seal-{timestamp}.json，manifest 追踪所有封卷记录。
ipcMain.handle("archive:seal-save", (_e, payload) => {
    const { filename, doc } = payload;
    const sealFile = join(MEMORY_DIR, filename);
    writeJson(sealFile, doc);

    const manifest = readJson(SEAL_MANIFEST_FILE) ?? { entries: [] };
    manifest.entries.push({
        file: filename,
        sealedAt: doc.meta?.封卷时间 ?? new Date().toISOString(),
        version: doc.meta?.版本 ?? "1.0",
        sourceRange: { start: doc.meta?.来源区间?.startIndex ?? -1, end: doc.meta?.来源区间?.endIndex ?? -1 },
        finaleJudgment: doc.meta?.终局判定 ?? "unknown",
        sceneCount: doc.scenes?.length ?? 0,
        status: payload.needsReview ? "needs-review" : "ok",
    });
    writeJson(SEAL_MANIFEST_FILE, manifest);
    return true;
});

ipcMain.handle("archive:seal-load-all", () => {
    const manifest = readJson(SEAL_MANIFEST_FILE) ?? { entries: [] };
    const entries = [];
    for (const e of manifest.entries) {
        const sealFile = join(MEMORY_DIR, e.file);
        const doc = readJson(sealFile);
        entries.push({ entry: e, doc });
    }
    return entries;
});

ipcMain.handle("archive:seal-manifest", () => {
    const manifest = readJson(SEAL_MANIFEST_FILE);
    return manifest?.entries ?? [];
});

// ── IPC：隐藏剧情进度文件备份（IndexedDB 读写出错时的兜底） ────
const HIDDEN_PROGRESS_FILE = join(MEMORY_DIR, "hidden-progress.json");

ipcMain.handle("hidden-progress:load", () => {
    return readJson(HIDDEN_PROGRESS_FILE);
});

ipcMain.handle("hidden-progress:save", (_e, progress) => {
    writeJson(HIDDEN_PROGRESS_FILE, progress);
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

/**
 * 静态文件服务器：生产模式下把 dist/ 目录伺服为 http://127.0.0.1:PORT。
 *
 * 为什么不用 file:// 或 app:// 协议：
 *  - file:// 下绝对路径（/backgrounds/main-menu.jpg）会解析到磁盘根目录 → 404；
 *  - app:// 自定义协议下 IndexedDB 不可用（Pixi'VN 引擎存档依赖它）→ 黑屏。
 *  而 http:// 环境下 IndexedDB / ServiceWorker / 绝对路径全部原生支持，与 dev 一致。
 */
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
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
};

/**
 * ★★ 稳定端口（关键修复）：IndexedDB 是按「协议://主机:端口」隔离存储的！
 * 之前 server.listen(0) 每次启动都换随机端口 → 浏览器视为「新站点」→
 * 隐藏剧情进度 / 对话上下文 / 超神存档全部"隐形重置"（表现为：玩到一半像被点了退出、
 * 触发词被吞、进度时有时无）。因此端口必须固定：
 *   1. 优先用 userData/preferred-port.json 记住的端口；
 *   2. 首次升级（还没有记录时）自动接管 IndexedDB 目录里【最近一次真正用过的端口】，
 *      让用户现有进度直接复活（等于零迁移）；
 *   3. 极端情况下才随机并记住，之后保持稳定。
 */
function getPreferredPort() {
    const flagFile = join(app.getPath("userData"), "preferred-port.json");
    try {
        if (existsSync(flagFile)) {
            const p = JSON.parse(readFileSync(flagFile, "utf-8"))?.port;
            if (Number.isInteger(p) && p > 1024 && p < 65536) return p;
        }
    } catch {}
    try {
        const idbDir = join(app.getPath("userData"), "IndexedDB");
        if (existsSync(idbDir)) {
            const candidates = readdirSync(idbDir)
                .map((name) => {
                    const m = /^http_127\.0\.0\.1_(\d+)\.indexeddb\.leveldb$/.exec(name);
                    if (!m) return null;
                    try {
                        return { port: Number(m[1]), t: statSync(join(idbDir, name)).mtimeMs };
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
                .sort((a, b) => b.t - a.t);
            if (candidates.length > 0) return candidates[0].port;
        }
    } catch {}
    return null;
}

function rememberPort(port) {
    try {
        writeFileSync(
            join(app.getPath("userData"), "preferred-port.json"),
            JSON.stringify({ port }, null, 2),
            "utf-8",
        );
    } catch {}
}

function startStaticServer(distDir) {
    const server = createServer((req, res) => {
        try {
            const url = new URL(req.url, "http://127.0.0.1");
            let pathname = decodeURIComponent(url.pathname);
            if (pathname === "/" || pathname === "") pathname = "/index.html";
            const filePath = join(distDir, pathname);
            // 防目录穿越：只允许 dist 目录下的文件
            if (!filePath.startsWith(distDir + "\\") && !filePath.startsWith(distDir + "/")) {
                res.writeHead(403).end("Forbidden");
                return;
            }
            if (!existsSync(filePath) || !filePath.startsWith(distDir)) {
                res.writeHead(404).end("Not Found");
                return;
            }
            const ext = extname(filePath).toLowerCase();
            const type = MIME_TYPES[ext] || "application/octet-stream";
            res.writeHead(200, { "Content-Type": type });
            res.end(readFileSync(filePath));
        } catch (e) {
            res.writeHead(500).end(String(e));
        }
    });
    const listen = (port) =>
        new Promise((resolve, reject) => {
            const onError = (e) => {
                server.off("listening", onListening);
                reject(e);
            };
            const onListening = () => {
                server.off("error", onError);
                resolve(server.address().port);
            };
            server.once("error", onError);
            server.once("listening", onListening);
            server.listen(port, "127.0.0.1");
        });
    return (async () => {
        const preferred = getPreferredPort();
        if (preferred) {
            // 端口被占用时重试几次（多半是上一个实例刚退出还没释放），仍失败才落到随机口
            for (let i = 0; i < 6; i++) {
                try {
                    const p = await listen(preferred);
                    rememberPort(p);
                    console.log(`[whale] 静态服务器已启动（稳定端口）: http://127.0.0.1:${p}`);
                    return p;
                } catch {
                    await new Promise((r) => setTimeout(r, 500));
                }
            }
        }
        const p = await listen(0);
        rememberPort(p);
        console.log(`[whale] 静态服务器已启动（随机端口，已记住）: http://127.0.0.1:${p}`);
        return p;
    })();
}

// ── 窗口 ────────────────────────────────────────────────────
function createWindow(port) {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 640,
        title: "深海回响",
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        win.loadURL(`http://127.0.0.1:${port}/`);
    }
    return win;
}

app.whenReady().then(async () => {
    ensureMemoryDir();

    // 旧版本只有 conversation.json：启动时补生成一次人读镜像（md/txt），
    // 保证已有对话也能直接翻看。
    const legacyRecord = readJson(CONVERSATION_FILE);
    if (legacyRecord) {
        syncReadableMirrors(legacyRecord.messages ?? []);
    }

    let port = 0;
    if (!isDev || !process.env.VITE_DEV_SERVER_URL) {
        const distDir = join(__dirname, "../dist");
        port = await startStaticServer(distDir);
        console.log(`[whale] 静态服务器已启动: http://127.0.0.1:${port}`);
    }

    createWindow(port);
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});