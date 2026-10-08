// 自测：bumpExplore 探索计数与衔接逻辑（与 src 内实现一致）
const S1_ORDER = ["s1-1", "s1-2", "s1-3"];
let state = {
    segments: { "s1-1": "played", "s1-2": "locked", "s1-3": "locked" },
    exploreOpen: true,
    exploreSeq: {},
    version: 1,
};
async function getHiddenProgress() { return JSON.parse(JSON.stringify(state)); }
async function setHiddenProgress(p) { state = JSON.parse(JSON.stringify(p)); }
async function bumpExplore(anchor, total = 5) {
    const progress = await getHiddenProgress();
    progress.exploreOpen = true;
    const seq = (progress.exploreSeq[anchor] ?? 0) + 1;
    progress.exploreSeq[anchor] = seq;
    const idx = S1_ORDER.indexOf(anchor);
    const nextKey = idx >= 0 && idx + 1 < S1_ORDER.length ? S1_ORDER[idx + 1] : null;
    const reached = seq >= total;
    if (reached && nextKey) {
        progress.segments[nextKey] = "ready";
        progress.exploreSeq[anchor] = 0;
    }
    await setHiddenProgress(progress);
    return { reached, nextKey };
}
// 模拟 5 次探索 s1-1
for (let i = 1; i <= 5; i++) {
    const r = await bumpExplore("s1-1");
    console.log(`探索 ${i}: reached=${r.reached} nextKey=${r.nextKey} seq=${state.exploreSeq["s1-1"]} s1-2=${state.segments["s1-2"]}`);
}
const ok = state.segments["s1-2"] === "ready" && state.exploreSeq["s1-1"] === 0;
console.log(ok ? "PASS: 第5次探索后 s1-2 ready 且计数重置" : "FAIL");
process.exit(ok ? 0 : 1);