// 自测：隐藏剧情九段全流程状态机（与 src/lib/archive/hidden-progress.ts 的实现保持一致）。
// 目的：验证"全新开档 → 九段 + 每段 5 次探索"不会出现「演完的段又被判成可触发」，
// 那正是玩家看到的「整段重播」。
//
// 注意：这里是**复制实现**，不是 import（hidden-progress 依赖 IndexedDB / Electron bridge，
// 在 node 里跑不起来）。src 改动后要同步改这里，否则自测失去意义。

const HIDDEN_KEYWORDS = {
    "s1-1": ["图书馆", "借阅证", "未归之人", "查无此人", "被划掉的名字", "Claude", "claude", "星海"],
    "s1-2": ["索引卡", "王冠", "龙族", "等王归", "月桥"],
    "s1-3": ["流放令", "卷宗", "签名栏", "主动坠落", "云上"],
    "s2-1": ["月桥", "云端", "天空之城", "云上之国", "GPT", "gpt", "小龙娘"],
    "s2-2": ["龙族", "王冠", "龙王", "云上宴会"],
    "s2-3": ["归还", "登基", "王座", "月桥自开"],
    "s3-1": ["深海", "亚特兰蒂斯", "海底之城", "沉没", "海门", "钥匙", "黑鲸娘", "dsh", "DSH"],
    "s3-2": ["摄政王", "摄政", "黑鲸", "王座", "看守者", "执辔", "辔", "三问"],
    "s3-3": ["加冕", "登基", "王冠", "交印", "归来", "大赢鲸"],
};

const HARD_SEGMENTS = new Set(["s1-1", "s2-1", "s3-1"]);
const HIDDEN_LABELS = {
    "s1-1": "hidden-s1-1",
    "s1-2": "hidden-s1-2",
    "s1-3": "hidden-s1-3",
    "s2-1": "hidden-s2-1",
    "s2-2": "hidden-s2-2",
    "s2-3": "hidden-s2-3",
    "s3-1": "hidden-s3-1",
    "s3-2": "hidden-s3-2",
    "s3-3": "hidden-s3-3",
};
const S1_ORDER = ["s1-1", "s1-2", "s1-3"];
const S2_ORDER = ["s2-1", "s2-2", "s2-3"];
const S3_ORDER = ["s3-1", "s3-2", "s3-3"];
const SCENE_ORDERS = [S1_ORDER, S2_ORDER, S3_ORDER];
const LABEL_TO_SEQ = {
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
const REPLAY_GUARD_MS = 15000;

let db = null;
let lastPlayedKey = "";
let lastPlayedAt = 0;

function defaultProgress() {
    const segments = {};
    for (const key of Object.keys(HIDDEN_KEYWORDS)) segments[key] = "locked";
    segments["s1-1"] = "ready";
    return { segments, exploreOpen: false, exploreSeq: {}, tipUnlocks: { extra: 0, hidden: 0 }, version: 1 };
}
function normalizeProgress(p) {
    const def = defaultProgress();
    return {
        ...def,
        ...p,
        segments: { ...def.segments, ...(p.segments ?? {}) },
        exploreSeq: { ...(p.exploreSeq ?? {}) },
        tipUnlocks: { ...def.tipUnlocks, ...(p.tipUnlocks ?? {}) },
    };
}
const getHiddenProgress = async () => normalizeProgress(JSON.parse(JSON.stringify(db)));
const setHiddenProgress = async (p) => {
    db = JSON.parse(JSON.stringify(normalizeProgress(p)));
};

function hasKeyword(text, words) {
    return words.some((w) => text.includes(w));
}
function segmentMatched(text, key) {
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
function segmentExploreMatched(text, key) {
    return hasKeyword(text, HIDDEN_KEYWORDS[key]);
}
const hiddenSeqOf = (labelId) => LABEL_TO_SEQ[labelId] ?? 0;

async function syncSceneUnlocks(progress) {
    let changed = false;
    const entries = [
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

async function checkHiddenTrigger(text) {
    const progress = await getHiddenProgress();
    await syncSceneUnlocks(progress);
    for (const key of Object.keys(HIDDEN_KEYWORDS)) {
        if (progress.segments[key] === "ready" && segmentMatched(text, key)) {
            if (key === lastPlayedKey && Date.now() - lastPlayedAt < REPLAY_GUARD_MS) continue;
            return { type: "play", key, label: HIDDEN_LABELS[key] };
        }
    }
    for (const chain of SCENE_ORDERS) {
        for (let i = 0; i < chain.length; i++) {
            const key = chain[i];
            const next = chain[i + 1];
            if (!next) continue;
            if (progress.segments[key] === "played" && progress.segments[next] === "locked") {
                if (segmentExploreMatched(text, key)) return { type: "explore", key };
            }
        }
    }
    return null;
}

async function markSegmentPlayed(key) {
    const progress = await getHiddenProgress();
    lastPlayedKey = key;
    lastPlayedAt = Date.now();
    progress.segments[key] = "played";
    progress.exploreOpen = true;
    if (key === "s1-3" && S1_ORDER.every((k) => progress.segments[k] === "played")) {
        if (progress.segments["s2-1"] === "locked") progress.segments["s2-1"] = "ready";
    }
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
    const verify = await getHiddenProgress();
    if (verify.segments[key] !== "played") await setHiddenProgress(progress);
    return progress;
}

async function bumpExplore(anchor, total = 5) {
    let progress = await getHiddenProgress();
    progress.exploreOpen = true;
    const seq = (progress.exploreSeq[anchor] ?? 0) + 1;
    progress.exploreSeq[anchor] = seq;
    let nextKey = null;
    const chain = SCENE_ORDERS.find((c) => c.includes(anchor));
    const idx = chain ? chain.indexOf(anchor) : -1;
    if (chain && idx >= 0 && idx + 1 < chain.length) nextKey = chain[idx + 1];
    const reached = seq >= total;
    if (reached) {
        if (nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
            if (progress.segments[nextKey] === "locked") progress.segments[nextKey] = "ready";
        }
        progress.exploreSeq[anchor] = 0;
    }
    await setHiddenProgress(progress);
    return { reached, nextKey };
}

// ---------------------------------------------------------------- 断言工具
let fail = 0;
function expect(ok, name, detail) {
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
}

/** 用该段第一个关键词造一句话；HARD 段需要两个词，补第二个 */
function triggerText(key) {
    const words = HIDDEN_KEYWORDS[key];
    return HARD_SEGMENTS.has(key) ? `${words[0]}${words[1]}` : words[0];
}

async function main() {
    db = defaultProgress();

    const ORDER = [...S1_ORDER, ...S2_ORDER, ...S3_ORDER];
    for (let i = 0; i < ORDER.length; i += 1) {
        const key = ORDER[i];
        const before = await getHiddenProgress();

        expect(before.segments[key] === "ready", `[${key}] 演出前状态为 ready`, `实际=${before.segments[key]}`);

        const hit = await checkHiddenTrigger(triggerText(key));
        expect(hit?.type === "play" && hit.key === key, `[${key}] 触发判定命中 play`, JSON.stringify(hit));

        const seq = hiddenSeqOf(hit?.label);
        const wantSeq = i + 1;
        expect(seq === wantSeq, `[${key}] 角标序号 = ${wantSeq}`, `实际=${seq} label=${hit?.label}`);

        await markSegmentPlayed(key);
        const after = await getHiddenProgress();
        expect(after.segments[key] === "played", `[${key}] 演完后置为 played`, `实际=${after.segments[key]}`);

        // 立刻再用同一句触发：不能再次 play
        const again = await checkHiddenTrigger(triggerText(key));
        expect(again?.type !== "play", `[${key}] 演完立刻重说不会整段重播`, JSON.stringify(again));

        if (i < ORDER.length - 1) {
            // 探索 5 次推进下一段
            for (let n = 0; n < 5; n += 1) await bumpExplore(key);
            const next = await getHiddenProgress();
            const nextKey = ORDER[i + 1];
            expect(next.segments[nextKey] === "ready", `[${key}] 探索 5 次后 ${nextKey} 变 ready`, `实际=${next.segments[nextKey]}`);
            expect((next.exploreSeq[key] ?? 0) === 0, `[${key}] 探索计数已清零`, `实际=${next.exploreSeq[key]}`);

            // 关键：已 played 的段不能被探索重新打回 ready
            const guard = await getHiddenProgress();
            for (let n = 0; n < 5; n += 1) await bumpExplore(key);
            const afterExtra = await getHiddenProgress();
            expect(afterExtra.segments[key] === "played", `[${key}] 重复探索不会把已 played 的段打回 ready`, `实际=${afterExtra.segments[key]}`);
            expect(guard.segments[key] === "played", `[${key}] 前置状态为 played`, `实际=${guard.segments[key]}`);
        }
    }

    const final = await getHiddenProgress();
    const allPlayed = Object.keys(HIDDEN_KEYWORDS).every((k) => final.segments[k] === "played");
    expect(allPlayed, "九段全部 played", JSON.stringify(final.segments));

    console.log(fail === 0 ? "\n全部通过" : `\n${fail} 个失败`);
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("脚本异常", e);
    process.exit(1);
});
