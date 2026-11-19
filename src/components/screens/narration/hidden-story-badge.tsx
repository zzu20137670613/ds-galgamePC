import { getActiveHiddenSeq, HIDDEN_TOTAL, hiddenSeqOf, subscribeHiddenSeq } from "@/lib/archive/hidden-progress";
import { useQueryDialogue } from "@/lib/query/narration-query";
import { narration } from "@drincs/pixi-vn";
import { useEffect, useState } from "react";

/**
 * 隐藏剧情角标：隐藏剧情主段演出中，右上角显示【隐藏剧情 X/9】。
 * X 对应当前段编号（S1-1=1 … S3-3=9）；探索小剧情等非主段演出时不显示。
 *
 * 两个来源取其一：
 *  1. 记账值（setActiveHiddenSeqFromLabel）—— 进入演出的调用方主动写；
 *  2. 当前 label 反查 —— 兜底。记账是"谁触发谁写"，探索第 5 次自动衔接这类路径
 *     一旦漏写，整段角标就没了（S3-2 实测踩到：8/9 全程不显示）。
 *     反查不依赖调用方，只要在演 hidden-s3-2 就一定是 8。
 */
export function HiddenStoryBadge() {
    const [seq, setSeq] = useState(getActiveHiddenSeq);
    /** 订阅对白变化：label 切换时重算反查值（narration.currentLabel 不是 React 状态） */
    useQueryDialogue();
    useEffect(() => subscribeHiddenSeq(setSeq), []);

    const derived = hiddenSeqOf(narration.currentLabel?.id);
    const shown = seq || derived;
    if (shown <= 0) return null;

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-50 rounded-full border border-sky-300/50 bg-sky-950/60 px-4 py-1.5 text-sm font-semibold text-sky-100 shadow-lg backdrop-blur">
            隐藏剧情 {shown}/{HIDDEN_TOTAL}
        </div>
    );
}
