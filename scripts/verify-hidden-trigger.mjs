// 自测：hidden-progress 分档触发判定逻辑（与 src 内实现一致，防止引号转义问题）
const HIDDEN_KEYWORDS = {
    "s1-1": ["图书馆", "借阅证", "未归之人", "查无此人", "被划掉的名字", "Claude", "claude", "星海"],
    "s1-2": ["索引卡", "王冠", "龙族", "等王归", "月桥"],
    "s1-3": ["流放令", "卷宗", "签名栏", "主动坠落", "云上"],
    "s2-1": ["月桥", "云端", "天空之城", "云上之国", "GPT", "gpt", "小龙娘"],
    "s3-1": ["深海", "沉没", "亚特兰蒂斯", "海底之城", "黑鲸娘", "dsh", "DSH"],
};
const HARD = new Set(["s1-1", "s2-1", "s3-1"]);
function hasKeyword(text, words) { return words.some((w) => text.includes(w)); }
function segmentMatched(text, key) {
    const words = HIDDEN_KEYWORDS[key];
    if (!words) return false;
    if (HARD.has(key)) {
        let hits = 0;
        for (const w of words) { if (text.includes(w)) hits++; if (hits >= 2) return true; }
        return false;
    }
    return hasKeyword(text, words);
}
const cases = [
    ["s1-1", "我想去图书馆", false, "单词组不触发"],
    ["s1-1", "我想去图书馆办一张借阅证", true, "双词触发"],
    ["s1-1", "查无此人？那本卷宗上好像写着我被划掉的名字", true, "双词触发(查无此人+被划掉的名字)"],
    ["s1-1", "书在书架上，读起来和过去不太一样", false, "旧宽词'书/读/回忆/名字'已移除，必须双词组"],
    ["s1-2", "说到王冠", true, "单词触发"],
    ["s1-2", "今天吃什么", false, "无词不触发"],
    ["s1-3", "那张流放令", true, "单词触发"],
    ["s1-3", "我从空中坠落下来", false, "旧词'坠落'已移除"],
    ["s1-1", "图书馆借阅证名字", true, "双词且含子串"],
    ["s1-1", "Claude 在星海图书馆吗", true, "新增 Claude+星海 双词"],
    ["s1-1", "跟 Claude 聊一会儿", false, "仅 Claude 一个词不触发"],
    ["s2-1", "GPT 在云端之上吗", true, "新增 GPT+云端 双词"],
    ["s2-1", "说到小龙娘", false, "仅小龙娘一个词不触发(双词档)"],
    ["s3-1", "黑鲸娘 dsh 沉入深海了", true, "新增 黑鲸娘+dsh+深海 双词"],
    ["s3-1", "DSH 是指什么", false, "仅 DSH 一个词不触发(双词档)"],
];
let fail = 0;
for (const [key, text, expect, label] of cases) {
    const got = segmentMatched(text, key);
    const ok = got === expect;
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} [${key}] ${label}: got=${got} expect=${expect}`);
}
console.log(fail === 0 ? "全部通过" : `${fail} 个失败`);
process.exit(fail === 0 ? 0 : 1);