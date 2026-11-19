/**
 * 番外篇注册表（独立体系，与九段隐藏剧情 / 新手教程完全解耦）。
 *
 * 规则（2026-10-07 用户定稿）：
 *  - 每个番外一个「锁死触发词」：玩家消息命中该词 → 拦截该消息（不发 API）→ 直接进全屏演出；
 *  - 无门控、无进度状态机、不写存档快照；**可反复触发**（随时敲随时回味，演完回聊天）；
 *  - 以后新增番外：在此表加一行 + 写对应 label + 在 assets 注册同名 bundle
 *    （bundle 名 = label id，Game.onLoadingLabel 会按 label id 预载 bundle）。
 */
export type ExtraStory = {
    /** 唯一 id（纯标识用） */
    id: string;
    /** 番外标题（人读用） */
    title: string;
    /** 锁死触发词：玩家消息包含该词即触发（全项目需保持唯一、不与素材/隐藏剧情词冲突） */
    trigger: string;
    /** pixi-vn label id（bundle 名与之一致） */
    label: string;
};

/**
 * 普通番外：以后新增的番外全部加在这里。
 *
 * ⚠️ 白米饭不在此列表 —— 它是终章，见下方 FINALE_EXTRA_STORY。
 */
const REGULAR_EXTRA_STORIES: readonly ExtraStory[] = [
    {
        id: "yulongwu",
        title: "一夜鱼龙舞",
        trigger: "一夜鱼龙舞",
        label: "extra-yulongwu",
    },
    {
        id: "suiyuejinghao",
        title: "岁月静好",
        trigger: "岁月静好",
        label: "extra-suiyuejinghao",
    },
    {
        id: "kaiguanri",
        title: "开馆日",
        // 触发词不带问号：命中判定是「消息包含该词」，写「今天营业吗」时
        // 玩家敲「今天营业吗？」同样包含它，两种写法都能进；反过来带问号就漏了没问号的写法。
        trigger: "今天营业吗",
        label: "extra-kaiguanri",
    },
];

/**
 * 终章番外《白米饭》—— 永久固定在列表最后（2026-11-03 用户定稿）。
 *
 * 为什么单独拎出来：玩家看完这一段，除封卷之外的全部内容就体验完了，
 * 它必须是「最后一个被看到的东西」。
 *
 * 所以：**新增番外一律加到 REGULAR_EXTRA_STORIES 里，不要动这里，
 * 也不要在 EXTRA_STORIES 导出之后追加** —— 下面的拼接保证了这一顺序。
 *
 * 与 2.5D《the-11th-forest》隐藏关互为彩蛋：那边通关后提示玩家回来敲这三个字。
 * 在 galgame 里这词本身不指向任何东西，只能靠通关暗号派过来 —— 彩蛋感才成立。
 */
const FINALE_EXTRA_STORY: ExtraStory = {
    id: "baifan",
    title: "白米饭",
    trigger: "白米饭",
    label: "extra-baifan",
};

/** 对外只暴露这一份：普通番外在前，终章番外永远压轴 */
export const EXTRA_STORIES: readonly ExtraStory[] = [...REGULAR_EXTRA_STORIES, FINALE_EXTRA_STORY];

/** 命中判定：文本包含任一「锁死触发词」→ 返回对应番外（可反复触发，无状态） */
export function matchExtraStory(text: string): ExtraStory | null {
    for (const story of EXTRA_STORIES) {
        if (text.includes(story.trigger)) return story;
    }
    return null;
}
