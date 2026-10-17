/**
 * 触发词解锁表（2026-10-17 用户定稿）。
 *
 * 玩法：聊天页顶栏两个按钮 → 玩对应的小游戏 → **分数过线**才解锁下一段触发词；
 * 解锁进度**累积展示**（该存档内永久能看，见 hidden-progress 的 tipUnlocks 快照，
 * 随存档绑定与恢复）；列表走完还继续通关 → 从第一段循环给。
 *
 * 两条边界（用户明确过，别越界）：
 *  - 分数门控**只管"能不能看到这个词"**，不是"能不能进剧情"；
 *  - 触发词是**纯展示**（可长按复制到剪贴板），**绝不写进聊天输入框** ——
 *    要不要去敲、敲了会不会进剧情，仍由玩家自己决定。
 */

export type TipKind = "extra" | "hidden";

export type TipEntry = {
    /** 展示给玩家的触发词（长按可复制） */
    text: string;
};

/**
 * 番外触发词：**以后还会新增**，新番外定稿时往数组末尾追加一行即可
 * （数组顺序 = 给词顺序，不要插队）。
 */
export const EXTRA_TIPS: readonly TipEntry[] = [{ text: "一夜鱼龙舞" }];

/**
 * 隐藏剧情触发词：9 段固定 = 3 场 × 3 段，这三条正是**三道章入口**的词
 * （章内第 2、3 段靠"探索期"推进，不给词 —— 见 hidden-progress 的探索衔接）。
 * 表已锁定，不再新增。
 */
export const HIDDEN_TIPS: readonly TipEntry[] = [
    { text: "Claude的图书馆借阅证" },
    { text: "gpt小龙娘的天空之城龙王宝座" },
    { text: "最后一段隐藏剧情要自己探索哦，提示：与深海有关" },
];

/** 两个按钮各自开哪个游戏（戳泡泡 / 接点心）与过关线（**严格大于**）。 */
export const TIP_TARGET: Record<TipKind, number> = { extra: 999, hidden: 666 };

export function tipsOf(kind: TipKind): readonly TipEntry[] {
    return kind === "extra" ? EXTRA_TIPS : HIDDEN_TIPS;
}

/** 通关次数 → 已解锁条数（累积；超过表长即视为全部解锁）。 */
export function unlockedCount(kind: TipKind, passes: number): number {
    const total = tipsOf(kind).length;
    const n = Math.floor(Number(passes) || 0);
    return Math.max(0, Math.min(n, total));
}

/** 本次通关**新给**的是第几段（1 基）。走完一圈从头再来 → 无限循环。 */
export function tipIndexOf(kind: TipKind, passes: number): number {
    const total = tipsOf(kind).length;
    const n = Math.max(1, Math.floor(Number(passes) || 0));
    return ((n - 1) % total) + 1;
}

/** 是否过线：**严格大于**（>999 / >666）。 */
export function isPass(kind: TipKind, score: number): boolean {
    return (Number(score) || 0) > TIP_TARGET[kind];
}

/** 离过关还差多少分（已过线返回 0），结算页用来给玩家一个具体目标。 */
export function shortfall(kind: TipKind, score: number): number {
    return Math.max(0, TIP_TARGET[kind] + 1 - (Number(score) || 0));
}