/**
 * 压缩机制核心模块（两遍滚窗 + JSON Schema 校验 + 落盘）
 * ─────────────────────────────────────────────────────────────
 * 设计定稿（2026-10-08 V4-Pro修正定稿）：
 *  目的：把全量纯日常对话压成「缩略剧本层」，交给孤胆枪手1风格 2.5D 游戏做地图。
 *  三层结构：L1 全量原文（不可改种子）→ L2 场景级缩略剧本（衍生品）→ L3 记忆盒子
 *  压缩由 API 判定保留什么（非破坏性），不外包给粗暴截断。
 *
 *  触发：手动「封卷」仪式（可重复，每次快照各自留档）
 *  范围：纯日常（排除 system/隐藏剧情/番外/教程/探索期小剧情）
 *  执行顺序：先终局裁判，后压缩；裁判 DENY 不阻断压缩。
 *
 *  两遍滚窗策略：
 *    第一遍「脊梁」分批发 → API 标场景边界 + 关键转折点 + 伏笔清单
 *    第二遍按脊梁标记的场景边界逐场景独立请求 API 展开详细缩略剧本 + 游戏映射
 *
 *  容错：JSON Schema 校验 → 不通过自动重试一次 → 两次都不通过保存 raw + 标注「需人工审核」
 * ─────────────────────────────────────────────────────────────
 */

import type { ChatMessage, WhaleWindow } from "@/lib/archive/context-archive";
import { isElectronDesktop } from "@/lib/archive/context-archive";
import { sendCompletionRequest } from "@/lib/api/chat-api";
import { SetupStore } from "@/lib/stores/setup-store";
import { ENEMY_REGISTRY, BOSS_SLOTS, type EnemyEntry, type BossSlot } from "@/lib/archive/enemy-registry";
import type { FinaleVerdict } from "@/lib/archive/finale";
import type { ReviewResult } from "@/lib/ai-review";

const SPINE_BATCH_SIZE = 400;
const COMPRESSION_MAX_TOKENS = 8192;

export type SceneType = "main" | "side" | "exploration" | "transition";

export type SceneBoundary = {
    startIndex: number;
    endIndex: number;
    sceneName: string;
    sceneType: SceneType;
    parentSceneId?: string;
};

type SpineBatchResult = {
    scenes: { startIndex: number; endIndex: number; sceneName: string; sceneType: SceneType; parentSceneId?: string }[];
    summaryForNext: string;
};

export type CompressedScene = {
    id: string;
    场景名: string;
    sceneType: SceneType;
    parentSceneId?: string;
    地点氛围: string;
    时间锚点: string;
    主要对话: { speaker: "user" | "assistant"; text: string }[];
    关键事件: string[];
    情感基调: string;
    角色: string[];
};

export type GameMapping = {
    sceneId: string;
    地图生图描述: string;
    预设敌人: string[];
    bossSlot: number | null;
    隐藏要素: string[];
    关卡开场对白: string;
    关卡结尾对白: string;
};

export type SealMeta = {
    封卷时间: string;
    版本: string;
    来源区间: { startIndex: number; endIndex: number };
    终局判定: FinaleVerdict;
    apiReview?: ReviewResult;
};

export type SealDocument = {
    scenes: CompressedScene[];
    游戏映射层: GameMapping[];
    meta: SealMeta;
};

export type SealManifestEntry = {
    file: string;
    sealedAt: string;
    version: string;
    sourceRange: { start: number; end: number };
    finaleJudgment: FinaleVerdict;
    sceneCount: number;
    status: "ok" | "needs-review";
};

export type SealManifest = {
    entries: SealManifestEntry[];
};

type ExpandSceneResult = {
    scene: CompressedScene;
    gameMapping: GameMapping;
};

const SPINE_SYSTEM_PROMPT = `你是剧本分析师。下面是一段角色扮演对话的连续片段。

你的任务：识别这段对话中的「场景边界」——话题、地点或情感氛围发生明显变化的地方。

规则：
1. 将对话切分为若干场景，每个场景标注 startIndex / endIndex（相对本批次消息的索引，从 0 开始计数）
2. sceneName: 中文，2-6 字
3. sceneType: "main"（主线相关）| "side"（日常支线）| "exploration"（自由闲逛）| "transition"（过渡衔接）
4. 短暂寒暄（<3 轮）不单独成景，并入前后场景
5. 情感/氛围发生显著转折时，即使对话主题没变也应分场
6. 同一场景如果 messages 索引不连续（中间有被删内容），视为独立场景段
7. summaryForNext: 一句话概括本批次场景，供下一批次的上下文使用

请只返回 JSON，格式如下：
{"scenes":[{"startIndex":0,"endIndex":12,"sceneName":"...","sceneType":"..."}],"summaryForNext":"..."}`;

const PREVIOUS_SPINE_TEMPLATE = "前批场景概览：{summary}\n\n下面是接续的新片段：";

const SCENE_EXPAND_PROMPT = `你是游戏设计师和剧本分析师。

先阅读这段对话片段，生成缩略剧本；然后为该场景配置对应的游戏关卡。

可用的敌人类型（只能从中选择，不得发明新类型）：
{enemyList}

可用的 Boss 槽位（只能从中选择，不得发明）：
{bossList}

要求：
- 主要对话严格原文摘录，禁止自由改写对白
- 关键事件只写事件名（一句一事件）
- 地图生图描述用英文，50-100 词，描述适合生成 2.5D 等角视图的视觉效果
- 预设敌人从可用列表中选取（id），一般过渡场不配敌人
- bossSlot 一般填 null，仅在重要主线场填关卡编号
- 隐藏要素贴合孤胆枪手隐藏点传统（暗门/通风口/隐藏房间）
- 关卡开场/结尾对白各自一段，自然衔接

请只返回 JSON：
{
  "场景名": "2-6字中文名",
  "sceneType": "main|side|exploration|transition",
  "地点氛围": "中文描述",
  "时间锚点": "故事内的相对时间",
  "主要对话": [{"speaker":"user|assistant","text":"原文摘录"}],
  "关键事件": ["事件1","事件2"],
  "情感基调": "二字词",
  "角色": ["出场的角色名"],
  "游戏映射": {
    "地图生图描述": "英文描述",
    "预设敌人": ["enemy-id"],
    "bossSlot": null,
    "隐藏要素": ["要素1"],
    "关卡开场对白": "一段话",
    "关卡结尾对白": "一段话"
  }
}`;

function serializeForPrompt(messages: ChatMessage[]): string {
    return messages
        .map((m, i) => `${i.toString().padStart(4, " ")} ${m.role === "user" ? "[U]" : "[A]"} ${m.content}`)
        .join("\n");
}

function serializeCompact(messages: ChatMessage[]): string {
    return messages
        .map((m) => `${m.role === "user" ? "玩家" : "鲸鱼娘"}：${m.content}`)
        .join("\n");
}

function buildEnemyList(): string {
    return ENEMY_REGISTRY.map((e) => `- ${e.id} (${e.name}): ${e.traits.join("，")}`).join("\n");
}

function buildBossList(): string {
    return BOSS_SLOTS.map((b) => `- 关卡${b.level}: ${ENEMY_REGISTRY.find((e) => e.id === b.enemyId)?.name ?? b.enemyId} (${b.conditionHint})`).join("\n");
}

export function filterDailyMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter((m) => m.role !== "system");
}

async function requestSpineBatch(
    batchMessages: ChatMessage[],
    apiKey: string,
    previousSummary: string,
): Promise<SpineBatchResult> {
    const serialized = serializeForPrompt(batchMessages);
    let systemContent = SPINE_SYSTEM_PROMPT;
    if (previousSummary) {
        systemContent = PREVIOUS_SPINE_TEMPLATE.replace("{summary}", previousSummary) + "\n\n" + systemContent;
    }

    const messages = [
        { role: "system" as const, content: systemContent },
        { role: "user" as const, content: serialized },
    ];

    let response = await sendCompletionRequest(messages, apiKey, { maxTokens: 2048 });
    let result = parseSpineResult(response.content);

    if (result.scenes.length === 0 && batchMessages.length > 0) {
        response = await sendCompletionRequest(messages, apiKey, { maxTokens: 2048 });
        result = parseSpineResult(response.content);
    }

    return result;
}

function parseSpineResult(raw: string): SpineBatchResult {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("未找到 JSON 对象");
        const parsed = JSON.parse(jsonMatch[0]);

        return {
            scenes: (parsed.scenes || []).map((s: Record<string, unknown>) => ({
                startIndex: Number(s.startIndex ?? 0),
                endIndex: Number(s.endIndex ?? 0),
                sceneName: String(s.sceneName ?? "未命名"),
                sceneType: (["main", "side", "exploration", "transition"].includes(String(s.sceneType)) ? String(s.sceneType) : "transition") as SceneType,
                parentSceneId: s.parentSceneId ? String(s.parentSceneId) : undefined,
            })),
            summaryForNext: String(parsed.summaryForNext ?? ""),
        };
    } catch {
        return { scenes: [], summaryForNext: "" };
    }
}

async function expandSceneWithMapping(
    sceneMessages: ChatMessage[],
    sceneId: string,
    apiKey: string,
): Promise<ExpandSceneResult | null> {
    const serialized = serializeCompact(sceneMessages);
    const systemContent = SCENE_EXPAND_PROMPT
        .replace("{enemyList}", buildEnemyList())
        .replace("{bossList}", buildBossList());

    const messages = [
        { role: "system" as const, content: systemContent },
        { role: "user" as const, content: serialized },
    ];

    const response = await sendCompletionRequest(messages, apiKey, { maxTokens: COMPRESSION_MAX_TOKENS });
    return parseExpandResult(response.content, sceneId);
}

function parseExpandResult(raw: string, sceneId: string): ExpandSceneResult | null {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]);
        const gm = parsed.游戏映射 || {};

        return {
            scene: {
                id: sceneId,
                场景名: String(parsed.场景名 ?? "未命名"),
                sceneType: (["main", "side", "exploration", "transition"].includes(String(parsed.sceneType)) ? String(parsed.sceneType) : "transition") as SceneType,
                parentSceneId: parsed.parentSceneId ? String(parsed.parentSceneId) : undefined,
                地点氛围: String(parsed.地点氛围 ?? ""),
                时间锚点: String(parsed.时间锚点 ?? ""),
                主要对话: Array.isArray(parsed.主要对话) ? parsed.主要对话.map((d: Record<string, unknown>) => ({
                    speaker: (String(d.speaker) === "assistant" ? "assistant" : "user") as "user" | "assistant",
                    text: String(d.text ?? ""),
                })) : [],
                关键事件: Array.isArray(parsed.关键事件) ? parsed.关键事件.map(String) : [],
                情感基调: String(parsed.情感基调 ?? ""),
                角色: Array.isArray(parsed.角色) ? parsed.角色.map(String) : [],
            },
            gameMapping: {
                sceneId,
                地图生图描述: String(gm.地图生图描述 ?? ""),
                预设敌人: Array.isArray(gm.预设敌人) ? gm.预设敌人.map(String) : [],
                bossSlot: gm.bossSlot != null ? Number(gm.bossSlot) : null,
                隐藏要素: Array.isArray(gm.隐藏要素) ? gm.隐藏要素.map(String) : [],
                关卡开场对白: String(gm.关卡开场对白 ?? ""),
                关卡结尾对白: String(gm.关卡结尾对白 ?? ""),
            },
        };
    } catch {
        return null;
    }
}

function validateSealDocument(doc: unknown): doc is SealDocument {
    if (!doc || typeof doc !== "object") return false;
    const d = doc as Record<string, unknown>;
    if (!Array.isArray(d.scenes)) return false;
    if (!Array.isArray(d.游戏映射层)) return false;
    if (!d.meta || typeof d.meta !== "object") return false;
    const meta = d.meta as Record<string, unknown>;
    if (typeof meta.封卷时间 !== "string") return false;
    if (typeof meta.来源区间 !== "object") return false;
    return true;
}

export async function generateSpine(
    dailyMessages: ChatMessage[],
    apiKey: string,
): Promise<SceneBoundary[]> {
    const batches: { messages: ChatMessage[]; offset: number }[] = [];
    for (let i = 0; i < dailyMessages.length; i += SPINE_BATCH_SIZE) {
        batches.push({
            messages: dailyMessages.slice(i, i + SPINE_BATCH_SIZE),
            offset: i,
        });
    }

    let previousSummary = "";
    const allBoundaries: SceneBoundary[] = [];

    for (const batch of batches) {
        const raw = await requestSpineBatch(batch.messages, apiKey, previousSummary);
        previousSummary = raw.summaryForNext || previousSummary;

        for (const s of raw.scenes) {
            allBoundaries.push({
                startIndex: batch.offset + s.startIndex,
                endIndex: batch.offset + s.endIndex,
                sceneName: s.sceneName,
                sceneType: s.sceneType,
                parentSceneId: s.parentSceneId,
            });
        }
    }

    return allBoundaries;
}

export async function runCompression(
    dailyMessages: ChatMessage[],
    finaleVerdict: FinaleVerdict,
    signal?: AbortSignal,
): Promise<{ doc: SealDocument | null; raw: string | null; needsReview: boolean }> {
    const apiKey = SetupStore.store.state.apiKey;
    if (!apiKey) throw new Error("未配置 API Key");

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const boundaries = await generateSpine(dailyMessages, apiKey);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const scenes: CompressedScene[] = [];
    const gameMappings: GameMapping[] = [];
    let hasFailures = false;

    for (let i = 0; i < boundaries.length; i++) {
        const b = boundaries[i];
        const sceneMessages = dailyMessages.slice(b.startIndex, b.endIndex + 1);
        const sceneId = `s${String(i + 1).padStart(3, "0")}_${b.sceneName}`;

        let result = await expandSceneWithMapping(sceneMessages, sceneId, apiKey);

        if (!result) {
            const retry = await expandSceneWithMapping(sceneMessages, sceneId, apiKey);
            if (retry) {
                result = retry;
            } else {
                hasFailures = true;
                result = {
                    scene: {
                        id: sceneId,
                        场景名: b.sceneName,
                        sceneType: b.sceneType,
                        parentSceneId: b.parentSceneId,
                        地点氛围: "",
                        时间锚点: "",
                        主要对话: [],
                        关键事件: [],
                        情感基调: "",
                        角色: [],
                    },
                    gameMapping: {
                        sceneId,
                        地图生图描述: "",
                        预设敌人: [],
                        bossSlot: null,
                        隐藏要素: [],
                        关卡开场对白: "",
                        关卡结尾对白: "",
                    },
                };
            }
        }

        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        if (result) {
            scenes.push(result.scene);
            gameMappings.push(result.gameMapping);
        }
    }

    const doc: SealDocument = {
        scenes,
        游戏映射层: gameMappings,
        meta: {
            封卷时间: new Date().toISOString(),
            版本: "1.0",
            来源区间: {
                startIndex: 0,
                endIndex: dailyMessages.length - 1,
            },
            终局判定: finaleVerdict,
        },
    };

    if (!validateSealDocument(doc)) {
        const raw = JSON.stringify(doc, null, 2);
        return { doc: null, raw, needsReview: true };
    }

    if (hasFailures) {
        return { doc, raw: JSON.stringify(doc, null, 2), needsReview: true };
    }

    return { doc, raw: JSON.stringify(doc, null, 2), needsReview: false };
}

function isoToFilename(iso: string): string {
    return iso.replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

function getSealFilename(): string {
    return `seal-${isoToFilename(new Date().toISOString())}.json`;
}

async function openSealDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("seal_archive_db", 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("seals")) {
                db.createObjectStore("seals", { keyPath: "file" });
            }
            if (!db.objectStoreNames.contains("seal_manifest")) {
                db.createObjectStore("seal_manifest", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveSealToDB(
    doc: SealDocument,
    needsReview: boolean,
): Promise<SealManifestEntry> {
    const filename = getSealFilename();
    const entry: SealManifestEntry = {
        file: filename,
        sealedAt: doc.meta.封卷时间,
        version: doc.meta.版本,
        sourceRange: { start: doc.meta.来源区间.startIndex, end: doc.meta.来源区间.endIndex },
        finaleJudgment: doc.meta.终局判定,
        sceneCount: doc.scenes.length,
        status: needsReview ? "needs-review" : "ok",
    };

    if (typeof indexedDB === "undefined") {
        if (isElectronDesktop()) {
            const bridge = (globalThis as WhaleWindow).whaleArchive!;
            await bridge.sealSave({ filename, doc, needsReview });
        }
        return entry;
    }

    const db = await openSealDB();

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["seals", "seal_manifest"], "readwrite");
        tx.objectStore("seals").put({ file: filename, doc });

        const getReq = tx.objectStore("seal_manifest").get("manifest");
        getReq.onsuccess = () => {
            const record = getReq.result as { entries?: SealManifestEntry[] } | undefined;
            const manifest: SealManifest = { entries: record?.entries ?? [] };
            manifest.entries.push(entry);
            tx.objectStore("seal_manifest").put({ id: "manifest", entries: manifest.entries });
        };
        getReq.onerror = () => reject(getReq.error);

        tx.oncomplete = () => {
            resolve();
            db.close();
        };
        tx.onerror = () => {
            reject(tx.error);
            db.close();
        };
    });

    if (isElectronDesktop()) {
        const bridge = (globalThis as WhaleWindow).whaleArchive!;
        await bridge.sealSave({ filename, doc, needsReview });
    }

    return entry;
}

export async function saveRawSealToDB(
    raw: string,
): Promise<SealManifestEntry> {
    const filename = `seal-raw-${isoToFilename(new Date().toISOString())}.json`;
    const entry: SealManifestEntry = {
        file: filename,
        sealedAt: new Date().toISOString(),
        version: "1.0-raw",
        sourceRange: { start: -1, end: -1 },
        finaleJudgment: "unknown",
        sceneCount: 0,
        status: "needs-review",
    };

    if (typeof indexedDB === "undefined") {
        if (isElectronDesktop()) {
            const bridge = (globalThis as WhaleWindow).whaleArchive!;
            await bridge.sealSave({
                filename,
                doc: { __raw: true, content: raw },
                needsReview: true,
            });
        }
        return entry;
    }

    const db = await openSealDB();

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["seals", "seal_manifest"], "readwrite");
        tx.objectStore("seals").put({ file: filename, doc: { __raw: true, content: raw } });

        const getReq = tx.objectStore("seal_manifest").get("manifest");
        getReq.onsuccess = () => {
            const record = getReq.result as { entries?: SealManifestEntry[] } | undefined;
            const manifest: SealManifest = { entries: record?.entries ?? [] };
            manifest.entries.push(entry);
            tx.objectStore("seal_manifest").put({ id: "manifest", entries: manifest.entries });
        };
        getReq.onerror = () => reject(getReq.error);

        tx.oncomplete = () => {
            resolve();
            db.close();
        };
        tx.onerror = () => {
            reject(tx.error);
            db.close();
        };
    });

    if (isElectronDesktop()) {
        const bridge = (globalThis as WhaleWindow).whaleArchive!;
        await bridge.sealSave({
            filename,
            doc: { __raw: true, content: raw },
            needsReview: true,
        });
    }

    return entry;
}

export async function loadSealManifest(): Promise<SealManifest> {
    if (typeof indexedDB === "undefined") return { entries: [] };
    const db = await openSealDB();
    return new Promise<SealManifest>((resolve, reject) => {
        const tx = db.transaction("seal_manifest", "readonly");
        const getReq = tx.objectStore("seal_manifest").get("manifest");
        getReq.onsuccess = () => {
            const record = getReq.result as { entries?: SealManifestEntry[] } | undefined;
            resolve({ entries: record?.entries ?? [] });
            db.close();
        };
        getReq.onerror = () => {
            reject(getReq.error);
            db.close();
        };
    });
}

export async function loadSealFromDB(filename: string): Promise<SealDocument | null> {
    if (typeof indexedDB === "undefined") return null;
    const db = await openSealDB();
    return new Promise<SealDocument | null>((resolve, reject) => {
        const tx = db.transaction("seals", "readonly");
        const getReq = tx.objectStore("seals").get(filename);
        getReq.onsuccess = () => {
            const record = getReq.result as { doc?: SealDocument } | undefined;
            resolve(record?.doc ?? null);
            db.close();
        };
        getReq.onerror = () => {
            reject(getReq.error);
            db.close();
        };
    });
}