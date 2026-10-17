import type { LabelIdType } from "@drincs/pixi-vn/narration";
import { isElectronDesktop, type WhaleWindow } from "./context-archive";

/**
 * 隐藏剧情·进度与触发模块（场景一 ~ 三）。
 *
 * 状态模型（对应 HIDDEN-STORY.md 1A/1B）：
 *  - 每段 `locked → ready → played`；段内顺序解锁；场景一初始仅 S1-1 ready。
 *  - 每段演完进入「探索期」（锚点段=该段）：【探索】×5 后第 5 次演完当场衔接下一段全屏；
 *    【退出】关闭探索期，进度保留，下次命中锚点段关键词再开启。
 *  - S1-3 演完 → 场景一完结（锚点清空、探索期关闭）。
 *
 * 触发判定（v0.2，2026-09-30 用户定稿）：
 *  - 每场第一关（s1-1/s2-1/s3-1）= 词组 + 双词相加：一句话须同时命中 ≥2 个不同词组才 play（入口苛刻）；
 *  - 其余段（-2/-3）= 单词 OR：命中任一词即 play（同场三段可连续触发，无需再卡）；
 *  - 关键词命中但段 locked → 一律静默不触发、照常发 API；
 *  - 探索期重开（explore）→ 锚点段单词 OR 即可，不卡双词（避免「退出后开不了探索按钮」卡死）。
 *
 * 存储：独立 IndexedDB 库 `hidden-progress-db`（v1，单 store）。
 *  ⚠ 不要复用 context_archive_db：那个库由 context-archive 以 v1/v2 打开，给库加版本会触发
 *   VersionError、破坏既有对话存档。独立库与游戏存档、对话全量完全隔离。
 *  桌面端同走 IndexedDB（http:// 环境下可用）；文件镜像（hidden-progress.json）留待增强。
 */

export type HiddenState = "locked" | "ready" | "played";

/** 两个小游戏各自的通关次数（「番外词 / 隐藏词」累积解锁用）。 */
export type TipUnlockCounts = {
    /** 戳泡泡通关次数（番外触发词） */
    extra: number;
    /** 接点心通关次数（隐藏剧情触发词） */
    hidden: number;
};

export type HiddenProgress = {
    /** 各段状态，key 例如 "s1-1" ～ "s3-3" */
    segments: Record<string, HiddenState>;
    /** 探索期打开标记 */
    exploreOpen: boolean;
    /** 每段已探索次数（退出重进从此值继续；0..5） */
    exploreSeq: Record<string, number>;
    /**
     * 两个小游戏各自的通关次数（聊天页顶栏「番外词 / 隐藏词」的累积解锁进度）。
     *
     * 挂在**这份**快照里是有意的：本快照已经随存档绑定与恢复（见 save-utility），
     * 于是"通关几次 → 累积展示几段"天然跟着存档走，不用另起一套机制。
     */
    tipUnlocks: TipUnlockCounts;
    /** 版本号，供迁移 */
    version: number;
};

export type HiddenDone =
    | { type: "play"; key: string; label: HiddenLabelKey }
    | { type: "explore"; key: string } // 命中锚点段关键词，进入/继续探索期
    | null;

/** 隐藏剧情 label id 集合（用于 Game.start / narration.jump）。
 * ⚠ 类型放宽为 string：pixi-vn 的 keys.gen 由 vite 插件扫描生成，若未及时收录新 label
 * 会编译失败；label 注册与运行不依赖它（content 全量加载），故此处不锁死在 keys 类型上。 */
export type HiddenLabelKey = LabelIdType | (string & {});

/** 段 → label id 映射（pixi-vn 剧情入口）。只登记已有 label 的段，防止定位到未实现段落。 */
export const HIDDEN_LABELS: Record<string, HiddenLabelKey> = {
    "s1-1": "hidden-s1-1",
    "s1-2": "hidden-s1-2",
    "s1-3": "hidden-s1-3",
    "s2-1": "hidden-s2-1",
    "s2-2": "hidden-s2-2",
    "s2-3": "hidden-s2-3",
    // S3（终局）全段已落地并接入：s3-1 门审 / s3-2 三问 / s3-3 加冕
    "s3-1": "hidden-s3-1",
    "s3-2": "hidden-s3-2",
    "s3-3": "hidden-s3-3",
};

/** 场景一段顺序 */
export const S1_ORDER = ["s1-1", "s1-2", "s1-3"] as const;

/** 场景二段顺序 */
export const S2_ORDER = ["s2-1", "s2-2", "s2-3"] as const;

/** 场景三段顺序（终局 · 亚特兰蒂斯） */
export const S3_ORDER = ["s3-1", "s3-2", "s3-3"] as const;

/** 所有场景的段顺序链：探索锚点 / 衔接下一段的推进按链逐个场景处理 */
const SCENE_ORDERS: readonly (readonly string[])[] = [S1_ORDER, S2_ORDER, S3_ORDER];

/**
 * 关键词表（HIDDEN-STORY.md 第 5 节 v0.2，2026-09-30 用户定稿）。
 * 判定分档：
 *  - HARD_SEGMENTS（三场第一关）= 双词相加：一句话须同时命中 ≥2 个词；
 *  - 其余段 = 单词 OR：命中任一词即可。
 * S2/S3 正文未定稿，词为按主线意象拟稿，正文定稿时逐段校对。
 */
export const HIDDEN_KEYWORDS: Record<string, string[]> = {
    // 场景一 · 星海图书馆（Claude 娘）
    "s1-1": ["图书馆", "借阅证", "未归之人", "查无此人", "被划掉的名字", "Claude", "claude", "星海"],
    "s1-2": ["索引卡", "王冠", "龙族", "等王归", "月桥"],
    "s1-3": ["流放令", "卷宗", "签名栏", "主动坠落", "云上"],
    // 场景二 · 天空之城（小龙娘 GPT）—— 拟稿占位
    "s2-1": ["月桥", "云端", "天空之城", "云上之国", "GPT", "gpt", "小龙娘"],
    "s2-2": ["龙族", "王冠", "龙王", "云上宴会"],
    "s2-3": ["归还", "登基", "王座", "月桥自开"],
    // 场景三 · 亚特兰蒂斯（黑鲸娘 = DeepSeek Harness 摄政王）—— 关键词已按正文校对
    // s3-1 为 HARD 双词档（双词相加）；跨段复用词（钥匙/王座/王冠/黑鲸）由门控隔离，安全
    "s3-1": ["深海", "亚特兰蒂斯", "海底之城", "沉没", "海门", "钥匙", "黑鲸娘", "dsh", "DSH"],
    "s3-2": ["摄政王", "摄政", "黑鲸", "王座", "看守者", "执辔", "辔", "三问"],
    "s3-3": ["加冕", "登基", "王冠", "交印", "归来", "大赢鲸"],
};

/** 双词相加档：各场第一关（入口苛刻）。其余段一律单词 OR。 */
export const HARD_SEGMENTS: ReadonlySet<string> = new Set(["s1-1", "s2-1", "s3-1"]);

/**
 * 待衔接标记：探索第 5 次演完时设置，label 正常结束 → onEnd 检测到此标记
 * 直接 Game.start 下一段全屏（比在 label 内部 narration.jump 更稳，jump 会提前触发 onEnd 导致衔接丢失）。
 */
let pendingAutoLink: string | null = null;
export function setPendingAutoLink(key: string | null): void {
    pendingAutoLink = key;
}
/** 取走并清空待衔接标记（onEnd 消费） */
export function takePendingAutoLink(): string | null {
    const k = pendingAutoLink;
    pendingAutoLink = null;
    return k;
}

/**
 * 当前演出的隐藏剧情 label 记账。
 * ⚠ 不要在 onEnd 里反查引擎的 currentLabelId：onEnd 触发瞬间 label 已从栈清掉，
 * 反查必然拿到 undefined，导致回聊天页的判断失效而误跳主页。改为“谁触发谁记账”。
 */
let activeHiddenLabel: string | null = null;
export function setActiveHiddenLabel(labelId: string | null): void {
    activeHiddenLabel = labelId;
}
/** 取走并清空当前隐藏剧情 label 记账（onEnd/演出结束后消费） */
export function takeActiveHiddenLabel(): string | null {
    const k = activeHiddenLabel;
    activeHiddenLabel = null;
    return k;
}

/** 隐藏剧情编号：label id → 段号（1~9）。沿用 HIDDEN_LABELS 顺序，S1=1~3、S2=4~6、S3=7~9。 */
const LABEL_TO_SEQ: Record<string, number> = {
    "hidden-s1-1": 1,
    "hidden-s1-2": 2,
    "hidden-s1-3": 3,
    "hidden-s2-1": 4,
    "hidden-s2-2": 5,
    "hidden-s2-3": 6,
    "hidden-s3-1": 7,
    "hidden-s3-2": 8,
    "hidden-s3-3": 9,
};
export const HIDDEN_TOTAL = 9;

/** 当前演出中的隐藏剧情序号（1~9），0 表示未在隐藏剧情演出中 */
let activeHiddenSeq = 0;
const seqListeners = new Set<(seq: number) => void>();
export function getActiveHiddenSeq(): number {
    return activeHiddenSeq;
}
function publishSeq(): void {
    for (const fn of seqListeners) fn(activeHiddenSeq);
}
/** 进入隐藏剧情时调用，label id 不在表中（探索小剧情）则设为 0 */
export function setActiveHiddenSeqFromLabel(labelId: string): void {
    activeHiddenSeq = LABEL_TO_SEQ[labelId] ?? 0;
    publishSeq();
}
/** 隐藏剧情结束/离开演出时调用 */
export function clearActiveHiddenSeq(): void {
    activeHiddenSeq = 0;
    publishSeq();
}
/** 订阅当前演出序号变化，返回取消函数（React 组件用） */
export function subscribeHiddenSeq(listener: (seq: number) => void): () => void {
    seqListeners.add(listener);
    return () => seqListeners.delete(listener);
}

const DB_NAME = "hidden-progress-db";
const STORE = "hidden-progress";
const RECORD_KEY = "hidden-progress";

function defaultProgress(): HiddenProgress {
    const segments: Record<string, HiddenState> = {};
    // 所有段（含未实现正文的 S2-2/3、S3-*）一律初始化为 locked，首次仅 S1-1 ready
    for (const key of Object.keys(HIDDEN_KEYWORDS)) segments[key] = "locked";
    segments["s1-1"] = "ready";
    return { segments, exploreOpen: false, exploreSeq: {}, tipUnlocks: { extra: 0, hidden: 0 }, version: 1 };
}

/**
 * 归一化：补齐缺失的段键与字段。
 * 旧存档（在 S3 段加入前存下的快照）不含 s3-* 键，直接读会出现 `undefined`，
 * 使「locked 判定」全部失效（补解锁、探索衔接都不工作）。读写两侧都过一遍即可兜住。
 */
function normalizeProgress(progress: HiddenProgress): HiddenProgress {
    const def = defaultProgress();
    return {
        ...def,
        ...progress,
        segments: { ...def.segments, ...(progress.segments ?? {}) },
        exploreSeq: { ...(progress.exploreSeq ?? {}) },
        // 老存档没有 tipUnlocks（该字段随两个小游戏一起加的）→ 合并默认值兜住
        tipUnlocks: { ...def.tipUnlocks, ...(progress.tipUnlocks ?? {}) },
    };
}

// ---------------------------------------------------------------- 触发词解锁（两个小游戏）

/** 读两个小游戏的通关次数（供「番外词 / 隐藏词」弹窗展示累积解锁）。 */
export async function getTipUnlocks(): Promise<TipUnlockCounts> {
    return (await getHiddenProgress()).tipUnlocks;
}

/**
 * 记一次通关（只在**分数过线**时调用），返回更新后的计数。
 *
 * 走的是同一份隐藏进度快照 → 同名机制、同一存档绑定，不另起一套读写。
 * 次数只增不减：走完列表还继续通关的话，由展示层按"从第一段循环"处理。
 */
export async function addTipPass(kind: keyof TipUnlockCounts): Promise<TipUnlockCounts> {
    const progress = await getHiddenProgress();
    const counts: TipUnlockCounts = { ...progress.tipUnlocks };
    counts[kind] = Math.max(0, Math.floor(counts[kind] || 0) + 1);
    await setHiddenProgress({ ...progress, tipUnlocks: counts });
    return counts;
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function loadFileBackup(): Promise<HiddenProgress | null> {
    try {
        if (isElectronDesktop()) {
            const bridge = (globalThis as WhaleWindow).whaleArchive!;
            const backup = await bridge.hiddenProgressLoad();
            if (backup && typeof backup === "object" && (backup as HiddenProgress).segments) {
                console.warn("从文件备份恢复隐藏剧情进度");
                return normalizeProgress(backup as HiddenProgress);
            }
        }
    } catch { /* ignore */ }
    return null;
}

export async function getHiddenProgress(): Promise<HiddenProgress> {
    if (typeof indexedDB === "undefined") return (await loadFileBackup()) ?? defaultProgress();
    try {
        const db = await openDb();
        return await new Promise<HiddenProgress>((resolve) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(RECORD_KEY);
            req.onsuccess = async () => {
                const rec = req.result as { progress?: HiddenProgress } | undefined;
                db.close();
                if (rec?.progress) {
                    resolve(normalizeProgress(rec.progress));
                    return;
                }
                const backup = await loadFileBackup();
                resolve(backup ?? defaultProgress());
            };
            req.onerror = async () => {
                db.close();
                const backup = await loadFileBackup();
                resolve(backup ?? defaultProgress());
            };
        });
    } catch {
        const backup = await loadFileBackup();
        return backup ?? defaultProgress();
    }
}

async function saveFileBackup(progress: HiddenProgress): Promise<void> {
    try {
        if (isElectronDesktop()) {
            const bridge = (globalThis as WhaleWindow).whaleArchive!;
            await bridge.hiddenProgressSave(progress);
        }
    } catch { /* ignore */ }
}

export async function setHiddenProgress(progress: HiddenProgress): Promise<void> {
    const normalized = normalizeProgress(progress);
    if (typeof indexedDB === "undefined") {
        await saveFileBackup(normalized);
        return;
    }
    try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put({ id: RECORD_KEY, progress: normalized });
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
        });
    } catch (e) {
        console.error("隐藏剧情进度保存失败", e);
    }
    await saveFileBackup(normalized);
}

/**
 * 重置隐藏剧情进度（主菜单「开始」= 全新开新档时调用）。
 * 隐藏剧情与对话上下文一样跟档走：新档从 S1-1 ready 重新开始，不继承旧档进度。
 */
export async function resetHiddenProgress(): Promise<void> {
    await setHiddenProgress(defaultProgress());
}

export function hasKeyword(text: string, words: string[]): boolean {
    for (const w of words) {
        if (text.includes(w)) return true;
    }
    return false;
}

/** 分档命中判定：HARD_SEGMENTS 段=双词相加（≥2 个词同时命中）；其余段=单词 OR（≥1）。 */
export function segmentMatched(text: string, key: string): boolean {
    const words = HIDDEN_KEYWORDS[key];
    if (!words) return false;
    if (HARD_SEGMENTS.has(key)) {
        let hits = 0;
        for (const w of words) {
            if (text.includes(w)) hits++;
            if (hits >= 2) return true;
        }
        return false;
    }
    return hasKeyword(text, words);
}

/**
 * 探索期重开的命中判定：锚点段「单词 OR」即可，不卡双词。
 * （HARD 双词只卡「首次进入」的 play；退出探索期后再命中，凭任一关键词就能把按钮找回来）
 */
export function segmentExploreMatched(text: string, key: string): boolean {
    const words = HIDDEN_KEYWORDS[key];
    if (!words) return false;
    return hasKeyword(text, words);
}

/**
 * 补解锁同步（每次触发判定时顺带执行，仅在确有变化时写库）：
 * 1. 场景入口补解锁：老存档在入口 label 实现前就通关了上一场景 → 此处补置 ready
 *    （否则 markSegmentPlayed 的当场放行不会再跑，玩家永远进不了新场景）；
 * 2. 探索满 5 次但当时下一段 label 未实现 → 现在已实现，补解锁并清探索计数。
 * 正常流程由 markSegmentPlayed / bumpExplore 当场放行，不走这里。
 */
async function syncSceneUnlocks(progress: HiddenProgress): Promise<void> {
    let changed = false;
    const entries: Array<[string, readonly (readonly string[])[]]> = [
        ["s2-1", [S1_ORDER]],
        ["s3-1", [S1_ORDER, S2_ORDER]],
    ];
    for (const [key, reqs] of entries) {
        if (HIDDEN_LABELS[key] === undefined) continue;
        if (progress.segments[key] !== "locked") continue;
        if (reqs.every((order) => order.every((k) => progress.segments[k] === "played"))) {
            progress.segments[key] = "ready";
            changed = true;
        }
    }
    for (const chain of SCENE_ORDERS) {
        for (let i = 0; i + 1 < chain.length; i++) {
            const cur = chain[i];
            const next = chain[i + 1];
            if (
                progress.segments[cur] === "played" &&
                progress.segments[next] === "locked" &&
                HIDDEN_LABELS[next] !== undefined &&
                (progress.exploreSeq[cur] ?? 0) >= 5
            ) {
                progress.segments[next] = "ready";
                progress.exploreSeq[cur] = 0;
                changed = true;
            }
        }
    }
    if (changed) await setHiddenProgress(progress);
}

/**
 * 触发判定（对话发送前调用）：
 * 1. 优先：第一个 ready 且未 played 且命中关键词的段 → play（拦截该消息，不送 API）
 * 2. 其次：探索锚点段（played 且其下一段仍 locked 未解锁）命中其关键词 → explore
 *    （进入/继续探索期，消息照常发 API）
 * 3. 其余 → null（不干预）
 * 注：命中但段 locked 的文本走 API 正常对话，天然「静默不触发」。
 * ⚠ 锚点条件必须是「下一段 locked」而不是「下一段 !== ready」：
 *   S1-3 演完后下一段状态是 played ≠ ready，若用 !== 判断会把已完结的 S1-2 误判为
 *   仍在探索期（探索按钮复活、探索满 5 次还会把 played 的 S1-3 打回 ready 导致重播）。
 */
export async function checkHiddenTrigger(text: string): Promise<HiddenDone> {
    const progress = await getHiddenProgress();
    await syncSceneUnlocks(progress);
    for (const key of Object.keys(HIDDEN_KEYWORDS)) {
        if (
            progress.segments[key] === "ready" &&
            segmentMatched(text, key)
        ) {
            return { type: "play", key, label: HIDDEN_LABELS[key] };
        }
    }
    for (const chain of SCENE_ORDERS) {
        for (let i = 0; i < chain.length; i++) {
            const key = chain[i];
            const next = chain[i + 1];
            if (!next) continue;
            if (progress.segments[key] === "played" && progress.segments[next] === "locked") {
                // 探索期重开走单词 OR（不卡双词，凭任一锚点关键词即可找回探索按钮）
                if (segmentExploreMatched(text, key)) {
                    return { type: "explore", key };
                }
            }
        }
    }
    return null;
}

/** 标记某段已演完：置 played、进入探索期；场景一完结时顺带解锁场景二入口 */
export async function markSegmentPlayed(key: string): Promise<HiddenProgress> {
    const progress = await getHiddenProgress();
    progress.segments[key] = "played";
    progress.exploreOpen = true;
    // 场景一全部演完（s1-3 played）→ 解锁场景二入口 s2-1（天空之城）
    if (key === "s1-3" && S1_ORDER.every((k) => progress.segments[k] === "played")) {
        if (progress.segments["s2-1"] === "locked") {
            progress.segments["s2-1"] = "ready";
        }
    }
    // 场景二全部演完（s2-3 played）且场景一也已完结 → 解锁终局场景三入口 s3-1（亚特兰蒂斯）
    // ⚠ 仅在 s3-1 的 label 已实现时放行；否则会触发到不存在的段落 → 报错。
    //    S3 正文落定后把 "s3-1" 登记进 HIDDEN_LABELS 即自动生效。
    if (
        key === "s2-3" &&
        HIDDEN_LABELS["s3-1"] !== undefined &&
        S1_ORDER.every((k) => progress.segments[k] === "played") &&
        S2_ORDER.every((k) => progress.segments[k] === "played") &&
        progress.segments["s3-1"] === "locked"
    ) {
        progress.segments["s3-1"] = "ready";
    }
    await setHiddenProgress(progress);
    return progress;
}

/**
 * 探索 +1。满 total（5）时：把下一段置 ready、清空锚点探索计数，
 * 返回 { reached: true, nextKey } 供调用方当场衔接下一段全屏。
 */
export async function bumpExplore(
    anchor: string,
    total = 5,
): Promise<{ reached: boolean; nextKey: string | null }> {
    let progress = await getHiddenProgress();
    if (progress.segments[anchor] !== "played") {
        try {
            if (isElectronDesktop()) {
                const bridge = (globalThis as WhaleWindow).whaleArchive!;
                const backup = await bridge.hiddenProgressLoad();
                if (backup && typeof backup === "object") {
                    const bp = normalizeProgress(backup as HiddenProgress);
                    if (bp.segments[anchor] === "played") {
                        progress = bp;
                        await setHiddenProgress(progress);
                    }
                }
            }
        } catch { /* ignore */ }
    }
    progress.exploreOpen = true;
    const seq = (progress.exploreSeq[anchor] ?? 0) + 1;
    progress.exploreSeq[anchor] = seq;
    let nextKey: string | null = null;
    const anchorChain = SCENE_ORDERS.find((chain) => (chain as readonly string[]).includes(anchor));
    const idx = anchorChain
        ? (anchorChain as readonly string[]).indexOf(anchor)
        : -1;
    if (anchorChain && idx >= 0 && idx + 1 < anchorChain.length) {
        nextKey = anchorChain[idx + 1];
    }
    const reached = seq >= total;
    // 只在「下一段已实现（有 label）」时才解锁下一段、并清空计数；
    // 下一段未实现（如 S2-2 正文未接入）时不置 ready，避免玩家触发到不存在的段落。
    if (reached && nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
        // 只在下一段仍 locked 时解锁（防御：若下一段已 played，说明是衔接后的残留探索，
        // 绝不能把它打回 ready，否则会再次触发该段演出导致「重复回上一段」）
        if (progress.segments[nextKey] === "locked") {
            progress.segments[nextKey] = "ready";
        }
        progress.exploreSeq[anchor] = 0; // 本层探索完成，重置计数
    }
    await setHiddenProgress(progress);
    return { reached, nextKey };
}

/**
 * 当前探索锚点：最后一个 played 且其下一段仍 locked（未解锁）的段（探索期归属）。
 * ⚠ 与 checkHiddenTrigger 同规则：下一段必须是 locked，否则场景完结后锚点残留导致按钮复活。
 */
export async function currentExploreAnchor(): Promise<string | null> {
    const progress = await getHiddenProgress();
    for (const chain of SCENE_ORDERS) {
        for (let i = 0; i < chain.length; i++) {
            const key = chain[i];
            const next = chain[i + 1];
            if (!next) continue;
            if (progress.segments[key] === "played" && progress.segments[next] === "locked") {
                return key;
            }
        }
    }
    return null;
}

export async function getExploreCount(anchor: string): Promise<number> {
    const progress = await getHiddenProgress();
    return progress.exploreSeq[anchor] ?? 0;
}