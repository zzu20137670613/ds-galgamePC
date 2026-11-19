/**
 * 上下文存档层。
 *
 * 目标（与桌面 EXE 阶段共用同一套接口）：
 *  - 全量记录从「和我一起探索未至之境吧」之后的每一句对话；
 *  - 每次打开游戏，同一个存档续写，不另起文件/记录；
 *  - 游戏内的“删除存档”操作不得清空这里的上下文（物理隔离：浏览器用独立
 *    IndexedDB 库，桌面端用独立文件夹，都不在游戏存档表里）；
 *  - 达到 token 阈值时，用户挑选出要「永远保留」的记忆片段，单独存档；
 *    「全量上下文」和「挑选保留的记忆」是两份独立数据，互不混淆。
 *
 * 浏览器阶段实现：IndexedDB（独立数据库 context_archive_db，内含两个对象存储：
 *   records —— 全量上下文，key 固定为 main-story；
 *   memories —— 挑选保留的记忆列表，key 固定为 saved-memories）。
 *
 * 桌面（Electron）阶段实现：在游戏安装目录的【根目录】下建立专门文件夹
 *   <根目录>/whale-memory/
 *   其中只放两份文件，不与任何其他数据混杂：
 *     conversation.json —— 全量上下文（对应 records）
 *     memories.json     —— 挑选保留的记忆（对应 memories）
 *  ★ 约束：exe 卸载时该文件夹必须保留（卸载逻辑不得删除它），
 *    因为这是玩家与鲸鱼娘「跨版本 / 跨迭代」的唯一记忆载体。
 *   只需替换本文件里的 backend 实例即可，上层聊天逻辑零改动。
 */

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
    role: ChatRole;
    content: string;
    /** 消息时间戳，用于排序与归档 */
    ts: number;
    /** 说话人（角色名），assistant 消息通常是鲸鱼娘的名字 */
    character?: string;
};

/** 上下文存档后端接口：上层只依赖这个接口，与具体落盘实现解耦 */
export interface ContextArchiveBackend {
    /** 读取当前存档的全部历史消息（无则返回空数组） */
    loadAll(): Promise<ChatMessage[]>;
    /** 追加一条或多条消息（续写，不覆盖已存在内容） */
    append(message: ChatMessage | ChatMessage[]): Promise<void>;
    /**
     * 清空全部历史消息。
     * 主菜单「开始」= 全新开新档时调用，保证不会续写上一轮的旧对话。
     */
    reset(): Promise<void>;
    /**
     * 整体替换历史消息。
     * 主菜单「继续」/读档时调用，把存档里绑定的对话快照恢复回上下文层。
     */
    replaceAll(messages: ChatMessage[]): Promise<void>;
}

/**
 * 一条「挑选保留的记忆」。
 * 由用户与鲸鱼娘共同确认后存档，独立于全量上下文；
 * 在上下文接近 token 上限时，这些记忆会随 system prompt 一起注入，确保不丢失。
 */
export type SavedMemory = {
    /** 记忆的唯一标识（时间戳字符串即可） */
    id: string;
    /** 记忆内容（一句话/一段话概括） */
    content: string;
    /** 记忆创建时间 */
    ts: number;
    /** 玩家自己的备注（可选，默认空字符串） */
    note?: string;
    /** API 审核共创记录（DeepSeek 审核后写入） */
    apiReview?: {
        status: "approved" | "needs_revision";
        comment: string;
        reviewedAt: number;
    };
};

/** 记忆存档后端接口：与全量上下文物理隔离（同一文件夹但独立文件 / 同一库独立 store） */
export interface MemoryArchiveBackend {
    /** 读取全部保留记忆（无则返回空数组） */
    loadAllMemories(): Promise<SavedMemory[]>;
    /** 保存完整记忆列表（覆盖式，调用方先读后写） */
    saveMemories(memories: SavedMemory[]): Promise<void>;
}

/** 浏览器 IndexedDB 实现：整个上下文存在一条记录（key 固定为 main-story） */
class IndexedDBContextArchive implements ContextArchiveBackend {
    private readonly dbName = "context_archive_db";
    /**
     * ⚠ 必须与 IndexedDBMemoryArchive 保持一致为 2：两个类共用同一库，
     * 若这里用 1、记忆类用 2，v1 先建库 v2 升级后，后续本类再以 v1 打开会抛
     * VersionError（"requested version (1) is less than existing version (2)"）。
     */
    private readonly dbVersion = 2;
    private readonly storeName = "records";
    private readonly recordKey = "main-story";

    private openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = () => {
                const db = request.result;
                // 升级到 v2：records 与 memories 两个 store 都建齐，
                // 保证无论哪个类先以 v2 打开都能完整建库
                if (!db.objectStoreNames.contains("records")) {
                    db.createObjectStore("records", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("memories")) {
                    db.createObjectStore("memories", { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadAll(): Promise<ChatMessage[]> {
        // SSR（Vite 插件评估）环境没有 indexedDB
        if (typeof indexedDB === "undefined") return [];
        const db = await this.openDb();
        return new Promise<ChatMessage[]>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readonly");
            const getRequest = tx.objectStore(this.storeName).get(this.recordKey);
            getRequest.onsuccess = () => {
                const record = getRequest.result as { messages?: ChatMessage[] } | undefined;
                resolve(record?.messages ?? []);
                db.close();
            };
            getRequest.onerror = () => {
                reject(getRequest.error);
                db.close();
            };
        });
    }

    async append(message: ChatMessage | ChatMessage[]): Promise<void> {
        if (typeof indexedDB === "undefined") return;
        const incoming = Array.isArray(message) ? message : [message];
        const existing = await this.loadAll();
        const next = [...existing, ...incoming];
        const db = await this.openDb();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).put({ id: this.recordKey, messages: next });
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            tx.onerror = () => {
                reject(tx.error);
                db.close();
            };
        });
    }

    async reset(): Promise<void> {
        if (typeof indexedDB === "undefined") return;
        const db = await this.openDb();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).delete(this.recordKey);
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            tx.onerror = () => {
                reject(tx.error);
                db.close();
            };
        });
    }

    async replaceAll(messages: ChatMessage[]): Promise<void> {
        if (typeof indexedDB === "undefined") return;
        const db = await this.openDb();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).put({ id: this.recordKey, messages });
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            tx.onerror = () => {
                reject(tx.error);
                db.close();
            };
        });
    }
}

/**
 * 浏览器 IndexedDB 记忆实现：与全量上下文同库、独立对象存储（memories），
 * 保证「全量上下文」与「挑选保留的记忆」两份数据互不混杂。
 */
class IndexedDBMemoryArchive implements MemoryArchiveBackend {
    private readonly dbName = "context_archive_db";
    private readonly dbVersion = 2;
    private readonly storeName = "memories";
    private readonly recordKey = "saved-memories";

    private openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = () => {
                const db = request.result;
                // 升级到 v2：新增 memories 存储（records 已存在则保留）
                if (!db.objectStoreNames.contains("records")) {
                    db.createObjectStore("records", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadAllMemories(): Promise<SavedMemory[]> {
        if (typeof indexedDB === "undefined") return [];
        const db = await this.openDb();
        return new Promise<SavedMemory[]>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readonly");
            const getRequest = tx.objectStore(this.storeName).get(this.recordKey);
            getRequest.onsuccess = () => {
                const record = getRequest.result as { memories?: SavedMemory[] } | undefined;
                resolve(record?.memories ?? []);
                db.close();
            };
            getRequest.onerror = () => {
                reject(getRequest.error);
                db.close();
            };
        });
    }

    async saveMemories(memories: SavedMemory[]): Promise<void> {
        if (typeof indexedDB === "undefined") return;
        const db = await this.openDb();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).put({ id: this.recordKey, memories });
            tx.oncomplete = () => {
                resolve();
                db.close();
            };
            tx.onerror = () => {
                reject(tx.error);
                db.close();
            };
        });
    }
}

// ── Electron 桌面端：通过 preload 暴露的主进程能力访问文件系统 ──────────
// preload（electron/preload.mjs）暴露：
//   window.whaleArchive = { loadAll, append, reset, replaceAll, loadAllMemories, saveMemories }
//   window.whaleAPI     = { chat }
// 记忆落在 <userData>/whale-memory/ 专属文件夹，卸载 exe 时保留。

export type WhaleWindow = typeof globalThis & {
    whaleArchive?: {
        loadAll: () => Promise<ChatMessage[]>;
        append: (message: ChatMessage | ChatMessage[]) => Promise<boolean>;
        reset: () => Promise<boolean>;
        replaceAll: (messages: ChatMessage[]) => Promise<boolean>;
        loadAllMemories: () => Promise<SavedMemory[]>;
        saveMemories: (memories: SavedMemory[]) => Promise<boolean>;
        sealSave: (payload: { filename: string; doc: unknown; needsReview?: boolean }) => Promise<boolean>;
        sealLoadAll: () => Promise<{ entry: unknown; doc: unknown }[]>;
        sealManifest: () => Promise<unknown[]>;
        hiddenProgressLoad: () => Promise<unknown>;
        hiddenProgressSave: (progress: unknown) => Promise<boolean>;
    };
};

/** 是否运行在 Electron 桌面端（preload 注入了 whaleArchive） */
export function isElectronDesktop(): boolean {
    return typeof globalThis !== "undefined" && Boolean((globalThis as WhaleWindow).whaleArchive);
}

/** Electron 文件系统实现：全量上下文与记忆都走主进程读写 whale-memory/ */
class ElectronContextArchive implements ContextArchiveBackend {
    private get bridge() {
        return (globalThis as WhaleWindow).whaleArchive!;
    }
    async loadAll(): Promise<ChatMessage[]> {
        return await this.bridge.loadAll();
    }
    async append(message: ChatMessage | ChatMessage[]): Promise<void> {
        await this.bridge.append(message);
    }
    async reset(): Promise<void> {
        await this.bridge.reset();
    }
    async replaceAll(messages: ChatMessage[]): Promise<void> {
        await this.bridge.replaceAll(messages);
    }
}

class ElectronMemoryArchive implements MemoryArchiveBackend {
    private get bridge() {
        return (globalThis as WhaleWindow).whaleArchive!;
    }
    async loadAllMemories(): Promise<SavedMemory[]> {
        return await this.bridge.loadAllMemories();
    }
    async saveMemories(memories: SavedMemory[]): Promise<void> {
        await this.bridge.saveMemories(memories);
    }
}

/** 运行时自动选后端：Electron 桌面端用文件系统，浏览器用 IndexedDB */
function resolveArchiveBackend(): ContextArchiveBackend {
    return isElectronDesktop() ? new ElectronContextArchive() : new IndexedDBContextArchive();
}

function resolveMemoryBackend(): MemoryArchiveBackend {
    return isElectronDesktop() ? new ElectronMemoryArchive() : new IndexedDBMemoryArchive();
}

/** 当前使用的存档后端：浏览器阶段用 IndexedDB，桌面阶段自动切换为文件系统实现 */
export const contextArchive: ContextArchiveBackend = resolveArchiveBackend();

/** 当前使用的记忆后端：浏览器阶段用 IndexedDB，桌面阶段自动切换为文件系统实现 */
export const memoryArchive: MemoryArchiveBackend = resolveMemoryBackend();

/** 便捷工具：把已有多条聊天记录按角色/内容序列化成一段文本（用于归档/摘要/提示词存档） */
export function serializeMessages(messages: ChatMessage[]): string {
    return messages
        .map((m) => {
            const who = m.character ? `${m.character}：` : `${m.role === "user" ? "玩家" : "鲸鱼娘"}：`;
            return `${who}${m.content}`;
        })
        .join("\n");
}

export { resolveArchiveBackend, resolveMemoryBackend };