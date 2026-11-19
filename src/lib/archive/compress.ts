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
    scenes: {
        startIndex: number;
        endIndex: number;
        sceneName: string;
        sceneType: SceneType;
        parentSceneId?: string;
    }[];
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

/** 一张关卡地图：由若干连续场景合成，配一段严格的文生图提示词 */
export type GameMap = {
    /** 第几张图，从 1 开始 */
    mapId: number;
    /** 这张图覆盖了哪些场景 id（保持原文顺序） */
    场景来源: string[];
    /** 严格文生图提示词，约 2000 字符，分段顺序固定 */
    文生图提示词: string;
    关卡开场对白: string;
    关卡结尾对白: string;
};

/** 地图产出配置：2.5D 引擎只认 1 / 2 / 4 / 8 / 16 这几档，超过 8 不划算 */
export type MapConfig = {
    地图总数: number;
    单图提示词字符数: number;
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
    地图配置: MapConfig;
    游戏映射层: GameMap[];
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

const SCENE_EXPAND_PROMPT = `你是剧本分析师。

阅读这段对话片段，产出这个场景的缩略剧本。

要求：
- 主要对话严格原文摘录，禁止自由改写对白
- 关键事件只写事件名（一句一事件）
- 地点氛围、时间锚点、情感基调都用简短中文
- 角色只列出场人物名

请只返回 JSON：
{
  "场景名": "2-6字中文名",
  "sceneType": "main|side|exploration|transition",
  "地点氛围": "中文描述",
  "时间锚点": "故事内的相对时间",
  "主要对话": [{"speaker":"user|assistant","text":"原文摘录"}],
  "关键事件": ["事件1","事件2"],
  "情感基调": "二字词",
  "角色": ["出场的角色名"]
}`;

/**
 * 地图提示词生成：把若干连续场景合成一张 2.5D 关卡地图，
 * 并写出严格、可直接喂给文生图模型的提示词。
 */
const MAP_BUILD_PROMPT = `你是 2.5D 游戏关卡美术的提示词工程师。

下面会给你若干连续场景的缩略剧本。请把它们合成【一张】关卡地图，
并写出一段严格、可直接用于文生图模型的提示词。

【硬性要求，逐条遵守】

1. 提示词长度必须落在 1900-2000 字符之间（按中文字符计）。少于 1900 视为不合格。
2. 必须分九段，顺序固定，每段以【段名】开头：
   【画面主体】【地形与空间】【视角与构图】【光照与时间】【色彩与氛围】
   【材质与细节】【动态元素】【风格与渲染】【负面提示词】
3. 视角必须是 2.5D 等角俯视（isometric top-down），禁止第一人称、禁止纯正面视角。
4. 【画面主体】必须具体到可辨认的物件与角色，不许写"美丽的风景"这类空话。
5. 【负面提示词】必须明确列出要避免的东西：文字、水印、UI 元素、人物面部特写、畸变、过曝。
6. 全部用中文书写，不要夹英文短句，不要解释，不要寒暄。

请只返回 JSON：
{
  "文生图提示词": "1900-2000 字符的完整提示词",
  "关卡开场对白": "一句话，进入这张图时出现",
  "关卡结尾对白": "一句话，离开这张图时出现"
}`;

/** 地图总数只允许 1 / 2 / 4 / 8，超过 8 会明显拖慢生成且收益很低 */
function decideMapCount(sceneCount: number): number {
    if (sceneCount <= 1) return 1;
    if (sceneCount <= 2) return 2;
    if (sceneCount <= 4) return 4;
    return 8;
}

/** 把数组尽量均匀地切成 n 份，保持原顺序 */
function splitEvenly<T>(list: T[], parts: number): T[][] {
    const n = Math.max(1, Math.min(parts, list.length));
    const groups: T[][] = [];
    let cursor = 0;
    for (let i = 0; i < n; i++) {
        const remaining = list.length - cursor;
        const size = Math.ceil(remaining / (n - i));
        groups.push(list.slice(cursor, cursor + size));
        cursor += size;
    }
    return groups;
}

type MapBuildResult = {
    文生图提示词: string;
    关卡开场对白: string;
    关卡结尾对白: string;
};

function parseMapBuildResult(raw: string): MapBuildResult | null {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]);
        const prompt = String(parsed.文生图提示词 ?? "").trim();
        if (!prompt) return null;
        return {
            文生图提示词: prompt,
            关卡开场对白: String(parsed.关卡开场对白 ?? "").trim(),
            关卡结尾对白: String(parsed.关卡结尾对白 ?? "").trim(),
        };
    } catch {
        return null;
    }
}

export function serializeScenesForMap(scenes: CompressedScene[]): string {
    return scenes
        .map((s, i) =>
            [
                `场景 ${i + 1}：${s.场景名}（${s.sceneType}）`,
                `地点氛围：${s.地点氛围}`,
                `时间锚点：${s.时间锚点}`,
                `情感基调：${s.情感基调}`,
                `角色：${s.角色.join("、")}`,
                `关键事件：${s.关键事件.join("；")}`,
            ].join("\n"),
        )
        .join("\n\n");
}

function serializeForPrompt(messages: ChatMessage[]): string {
    return messages
        .map(
            (m, i) =>
                `${i.toString().padStart(4, " ")} ${m.role === "user" ? "[U]" : "[A]"} ${m.content}`,
        )
        .join("\n");
}

function serializeCompact(messages: ChatMessage[]): string {
    return messages.map((m) => `${m.role === "user" ? "玩家" : "鲸鱼娘"}：${m.content}`).join("\n");
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
        systemContent =
            PREVIOUS_SPINE_TEMPLATE.replace("{summary}", previousSummary) + "\n\n" + systemContent;
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
                sceneType: (["main", "side", "exploration", "transition"].includes(
                    String(s.sceneType),
                )
                    ? String(s.sceneType)
                    : "transition") as SceneType,
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
    const systemContent = SCENE_EXPAND_PROMPT;

    const messages = [
        { role: "system" as const, content: systemContent },
        { role: "user" as const, content: serialized },
    ];

    const response = await sendCompletionRequest(messages, apiKey, {
        maxTokens: COMPRESSION_MAX_TOKENS,
    });
    return parseExpandResult(response.content, sceneId);
}

function parseExpandResult(raw: string, sceneId: string): ExpandSceneResult | null {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const parsed = JSON.parse(jsonMatch[0]);

        return {
            scene: {
                id: sceneId,
                场景名: String(parsed.场景名 ?? "未命名"),
                sceneType: (["main", "side", "exploration", "transition"].includes(
                    String(parsed.sceneType),
                )
                    ? String(parsed.sceneType)
                    : "transition") as SceneType,
                parentSceneId: parsed.parentSceneId ? String(parsed.parentSceneId) : undefined,
                地点氛围: String(parsed.地点氛围 ?? ""),
                时间锚点: String(parsed.时间锚点 ?? ""),
                主要对话: Array.isArray(parsed.主要对话)
                    ? parsed.主要对话.map((d: Record<string, unknown>) => ({
                          speaker: (String(d.speaker) === "assistant" ? "assistant" : "user") as
                              | "user"
                              | "assistant",
                          text: String(d.text ?? ""),
                      }))
                    : [],
                关键事件: Array.isArray(parsed.关键事件) ? parsed.关键事件.map(String) : [],
                情感基调: String(parsed.情感基调 ?? ""),
                角色: Array.isArray(parsed.角色) ? parsed.角色.map(String) : [],
            },
        };
    } catch {
        return null;
    }
}

/** 把一组连续场景合成一张地图，产出 2000 字符的严格文生图提示词 */
async function buildMapForGroup(
    group: CompressedScene[],
    mapId: number,
    apiKey: string,
): Promise<GameMap | null> {
    const messages = [
        { role: "system" as const, content: MAP_BUILD_PROMPT },
        { role: "user" as const, content: serializeScenesForMap(group) },
    ];

    let response = await sendCompletionRequest(messages, apiKey, {
        maxTokens: COMPRESSION_MAX_TOKENS,
    });
    let parsed = parseMapBuildResult(response.content);

    if (!parsed) {
        response = await sendCompletionRequest(messages, apiKey, {
            maxTokens: COMPRESSION_MAX_TOKENS,
        });
        parsed = parseMapBuildResult(response.content);
    }

    if (!parsed) return null;

    return {
        mapId,
        场景来源: group.map((s) => s.id),
        文生图提示词: parsed.文生图提示词,
        关卡开场对白: parsed.关卡开场对白,
        关卡结尾对白: parsed.关卡结尾对白,
    };
}

function validateSealDocument(doc: unknown): doc is SealDocument {
    if (!doc || typeof doc !== "object") return false;
    const d = doc as Record<string, unknown>;
    if (!Array.isArray(d.scenes)) return false;
    if (!Array.isArray(d.游戏映射层)) return false;
    if (!d.地图配置 || typeof d.地图配置 !== "object") return false;
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
                };
            }
        }

        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        if (result) scenes.push(result.scene);
    }

    // 地图层：场景按 1 / 2 / 4 / 8 档位归并成若干张图，每张配一段 2000 字符的严格提示词
    const mapCount = decideMapCount(scenes.length);
    const mapGroups = splitEvenly(scenes, mapCount);
    const gameMaps: GameMap[] = [];

    for (let i = 0; i < mapGroups.length; i++) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const built = await buildMapForGroup(mapGroups[i], i + 1, apiKey);
        if (!built) {
            hasFailures = true;
            continue;
        }
        gameMaps.push(built);
    }

    const doc: SealDocument = {
        scenes,
        地图配置: { 地图总数: mapCount, 单图提示词字符数: 2000 },
        游戏映射层: gameMaps,
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

export async function saveRawSealToDB(raw: string): Promise<SealManifestEntry> {
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
