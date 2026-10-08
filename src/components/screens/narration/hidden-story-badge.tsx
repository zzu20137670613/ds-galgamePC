import { getActiveHiddenSeq, HIDDEN_TOTAL, subscribeHiddenSeq } from "@/lib/archive/hidden-progress";
import { useEffect, useState } from "react";

/**
 * 隐藏剧情角标：隐藏剧情主段演出中，右上角显示【隐藏剧情 X/9】。
 * X 对应当前段编号（S1-1=1 … S3-3=9）；探索小剧情等非主段演出时不显示。
 */
export function HiddenStoryBadge() {
    const [seq, setSeq] = useState(getActiveHiddenSeq);

    useEffect(() => subscribeHiddenSeq(setSeq), []);

    if (seq <= 0) return null;

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-50 rounded-full border border-sky-300/50 bg-sky-950/60 px-4 py-1.5 text-sm font-semibold text-sky-100 shadow-lg backdrop-blur">
            隐藏剧情 {seq}/{HIDDEN_TOTAL}
        </div>
    );
}