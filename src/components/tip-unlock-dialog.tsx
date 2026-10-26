import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BubblePopGame, CatchSnackGame } from "@/components/mini-games";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addTipPass, getTipUnlocks } from "@/lib/archive/hidden-progress";
import {
    type TipKind,
    TIP_TARGET,
    isPass,
    shortfall,
    tipIndexOf,
    tipsOf,
    unlockedCount,
} from "@/lib/tips/tip-unlocks";

/**
 * 小游戏设计盒（416×320）。
 *
 * 原来游戏区写死 `h-[320px]`：PC / 模拟器 / 网页都够，实机横屏的可视高度往往只有 300 出头，
 * 底部被 `overflow-hidden` 直接裁掉 —— 接点心的判定线在 87%、托盘在 92%，正好落在被裁的那块，
 * 玩家看不见托盘就没法接（2026-10-26 实机反馈）。
 *
 * 改成以可视高度为基准**等比**缩小：宽高共用同一个缩放比，两个小游戏的坐标全是百分比，
 * 缩容器不影响判定逻辑与手感。
 *
 * 416 = 弹窗 `sm:max-w-md`(448) 减去左右 padding(32)，也就是 PC 上游戏区原本的宽度。
 */
const GAME_DESIGN_W = 416;
const GAME_DESIGN_H = 320;
const GAME_ASPECT = GAME_DESIGN_W / GAME_DESIGN_H;
/** 弹窗外框占用：外边距 32 + padding 32 = 64（横向），上下 padding 32 + 标题/说明约 72 + 栅格间距 12（纵向）。 */
const DIALOG_CHROME_W = 64;
const DIALOG_CHROME_H = 116;

function computeGameBox() {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const availH = vh - DIALOG_CHROME_H;
    const availW = Math.min(GAME_DESIGN_W, vw - DIALOG_CHROME_W);
    const height = Math.max(120, Math.round(Math.min(GAME_DESIGN_H, availH, availW / GAME_ASPECT)));
    return { w: Math.round(height * GAME_ASPECT), h: height };
}

/** 只在游戏局内跟踪视口变化：转屏、软键盘、分屏都会改可视高度。 */
function useGameBox(active: boolean) {
    const [box, setBox] = useState(computeGameBox);

    useEffect(() => {
        if (!active) return;
        const calc = () => setBox(computeGameBox());
        calc();
        window.addEventListener("resize", calc);
        window.addEventListener("orientationchange", calc);
        window.visualViewport?.addEventListener("resize", calc);
        return () => {
            window.removeEventListener("resize", calc);
            window.removeEventListener("orientationchange", calc);
            window.visualViewport?.removeEventListener("resize", calc);
        };
    }, [active]);

    return box;
}

/**
 * 「番外词 / 隐藏词」弹窗（2026-10-17 用户定稿）。
 *
 * 流程：看累积进度 → 点【开始】进小游戏 → 分数**过线**（严格大于）→ 按顺序解锁下一段
 * 触发词，弹回列表并把新解锁那条高亮；没过线则报"差 N 分"，可再玩一次。
 *
 * 三条边界（用户明确过）：
 *  - 门控只管**能不能看到词**，不是能不能进剧情；
 *  - 通关次数**绑存档**（存在隐藏进度快照里，随存档绑定/恢复）→ 已解锁的永久能看；
 *  - 触发词**纯展示 + 长按复制**，绝不写进聊天输入框。
 */
export function TipUnlockDialog({ kind, onClose }: { kind: TipKind; onClose: () => void }) {
    const tips = tipsOf(kind);
    const target = TIP_TARGET[kind];
    const [passes, setPasses] = useState(0);
    const [mode, setMode] = useState<"list" | "playing" | "result">("list");
    const [last, setLast] = useState<{ score: number; passed: boolean } | null>(null);
    const gameBox = useGameBox(mode === "playing");

    // 打开时读一次该存档的通关次数（累积进度跟存档走，不是全局进度）
    useEffect(() => {
        let alive = true;
        getTipUnlocks()
            .then((counts) => {
                if (alive) setPasses(counts[kind] || 0);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [kind]);

    const unlocked = unlockedCount(kind, passes);

    /**
     * 一局结束（结算页点【返回】时回调）。
     * 过线才记档：addTipPass 写的是隐藏进度快照 → 与存档绑定同一套机制。
     */
    const handleFinish = useCallback(
        (score: number) => {
            const passed = isPass(kind, score);
            setLast({ score, passed });
            setMode("result");
            if (passed) {
                addTipPass(kind)
                    .then((counts) => setPasses(counts[kind] || 0))
                    .catch(() => {});
            }
        },
        [kind],
    );

    return (
        <Dialog
            open
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <DialogContent
                className={
                    mode === "playing"
                        ? // 横屏实机的 85vh 会把游戏区挤进滚动条，局内放开高度上限、禁止滚动
                          "max-h-[100dvh] overflow-hidden sm:max-w-md"
                        : "sm:max-w-md"
                }
            >
                <DialogHeader>
                    <DialogTitle>{kind === "extra" ? "番外剧情触发词" : "隐藏剧情触发词"}</DialogTitle>
                    <DialogDescription>
                        {kind === "extra"
                            ? `在「戳泡泡」里拿到 ${target} 分以上，解锁下一段番外触发词。`
                            : `在「接点心」里拿到 ${target} 分以上，解锁下一段隐藏剧情触发词。`}
                    </DialogDescription>
                </DialogHeader>

                {mode === "list" && (
                    <div className="flex flex-col gap-3">
                        <div className="text-xs text-muted-foreground">
                            已解锁 <span className="font-semibold text-foreground">{unlocked}</span> / {tips.length}
                            　·　通关 {passes} 次
                            {passes >= tips.length && tips.length > 0 ? "（已集齐，再通关会从头循环）" : ""}
                        </div>
                        <ul className="flex flex-col gap-2">
                            {tips.map((tip, i) => {
                                const isUnlocked = i < unlocked;
                                // 「本次通关新给的那条」= 按次数取模回绕后的那一段 → 高亮它
                                const isFresh = isUnlocked && passes > 0 && tipIndexOf(kind, passes) === i + 1;
                                return (
                                    <TipRow
                                        key={tip.text}
                                        index={i + 1}
                                        text={tip.text}
                                        unlocked={isUnlocked}
                                        fresh={isFresh}
                                    />
                                );
                            })}
                        </ul>
                        <div className="text-[11px] text-muted-foreground">
                            提示：触发词只在这里展示，长按可复制；要不要去聊天里敲它，由你决定。
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                取消
                            </Button>
                            <Button size="sm" onClick={() => setMode("playing")}>
                                开始
                            </Button>
                        </div>
                    </div>
                )}

                {mode === "playing" && (
                    <div
                        className="mx-auto overflow-hidden rounded-lg bg-slate-950"
                        style={{ width: gameBox.w, height: gameBox.h }}
                    >
                        {kind === "extra" ? (
                            <BubblePopGame target={target} onFinish={handleFinish} />
                        ) : (
                            <CatchSnackGame target={target} onFinish={handleFinish} />
                        )}
                    </div>
                )}

                {mode === "result" && last && (
                    <div className="flex flex-col gap-3">
                        <div className="rounded-lg bg-muted/60 p-3 text-sm">
                            <div>
                                本局 <span className="font-semibold">{last.score}</span> 分（过关线 {target} 分）
                            </div>
                            {last.passed ? (
                                <div className="mt-1 text-emerald-600">
                                    达标 ✓ 已解锁第 {tipIndexOf(kind, passes)} 段
                                </div>
                            ) : (
                                <div className="mt-1 text-amber-600">还差 {shortfall(kind, last.score)} 分</div>
                            )}
                        </div>
                        {last.passed && (
                            <TipRow
                                index={tipIndexOf(kind, passes)}
                                text={tips[tipIndexOf(kind, passes) - 1].text}
                                unlocked
                                fresh
                            />
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
                                返回
                            </Button>
                            <Button size="sm" onClick={() => setMode("playing")}>
                                再玩一次
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * 一条触发词。
 *
 * 长按复制（600ms）而不是单击：这行本来就是"看一眼记下来的东西"，
 * 顺手点一下不该有任何副作用；要复制得按住 —— 鼠标按住和手指按住是同一套 pointer 事件。
 */
function TipRow({
    index,
    text,
    unlocked,
    fresh,
}: {
    index: number;
    text: string;
    unlocked: boolean;
    fresh?: boolean;
}) {
    const timer = useRef<number | null>(null);
    const cancel = () => {
        if (timer.current !== null) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
    };
    useEffect(() => cancel, []);

    const start = () => {
        if (!unlocked) return;
        cancel();
        timer.current = window.setTimeout(() => {
            timer.current = null;
            navigator.clipboard
                ?.writeText(text)
                .then(() => toast.success("已复制触发词"))
                .catch(() => toast.error("复制失败，请手动记下"));
        }, 600);
    };

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: 长按复制是可选便利功能，不影响阅读
        <li
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            className={[
                "rounded-lg border px-3 py-2 text-sm select-none",
                unlocked
                    ? fresh
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-border bg-background"
                    : "border-dashed border-border/60 bg-muted/30 text-muted-foreground",
            ].join(" ")}
            title={unlocked ? "长按复制" : "尚未解锁"}
        >
            <span className="mr-1 text-xs text-muted-foreground">{index}.</span>
            {unlocked ? text : "？".repeat(6)}
        </li>
    );
}