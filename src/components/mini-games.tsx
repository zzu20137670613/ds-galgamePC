import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
 * 下面所有常量与公式都是上游小游戏的 1:1 照抄，别乱改。
 * ------------------------------------------------------------------ */

// —— 游戏一：戳泡泡 ——
const BUBBLE_CELL_COUNT = 16; // 4×4 棋盘
const BUBBLE_DURATION = 30000; // 一局 30 秒
const BUBBLE_SPAWN_INTERVAL = 500; // 每 500ms 在随机空格生成 1 个泡泡（无空格则跳过）
const BUBBLE_LIFE = 1600; // 普通泡泡存活 1600ms
const STAR_LIFE = 1200; // 星星存活 1200ms
const BOMB_LIFE = 1600; // 上游没给炸弹寿命，按普通泡泡的 1600ms 处理
const BUBBLE_COMBO_WINDOW = 1200; // 连击窗口
const BUBBLE_SCORE_NORMAL = 10; // 普通泡泡基础分
const BUBBLE_SCORE_STAR = 30; // 星星基础分
const BUBBLE_BOMB_DELTA = -20; // 炸弹：分数 +(-20)，连击清零

// —— 游戏二：接点心 ——
const SNACK_DURATION = 30000; // 一局 30 秒
const SNACK_SPAWN_INTERVAL = 900; // 每 900ms 生成 1 个掉落物
const SNACK_SPAWN_X_MIN = 0.08; // x = 0.08 + random() * 0.84
const SNACK_SPAWN_X_RANGE = 0.84;
const SNACK_START_Y = -0.06; // 初始 y
const SNACK_SPEED_FROM = 0.16; // speed = 0.16 + progress * (0.42 - 0.16)
const SNACK_SPEED_TO = 0.42;
const SNACK_BASKET_Y = 0.92; // 篮子纵向位置
const SNACK_BASKET_WIDTH = 0.18; // 篮子宽度
const SNACK_CATCH_TOLERANCE = SNACK_BASKET_WIDTH / 2 + 0.03; // 接住判定 0.12
const SNACK_JUDGE_Y = SNACK_BASKET_Y - 0.05; // y >= 0.87 时触发一次判定
const SNACK_COMBO_WINDOW = 1500; // 连击窗口
const SNACK_SCORE_SNACK = 10; // 点心基础分
const SNACK_SCORE_STAR = 30; // 星星基础分
const SNACK_BOMB_PENALTY = 20; // 炸弹：score = max(0, score - 20)
const SNACK_BASKET_CLAMP_MIN = 0.02; // 篮子跟随指针时的夹取区间
const SNACK_BASKET_CLAMP_MAX = 0.98;

const HIT_EFFECT_MS = 300; // 命中反馈动画时长（纯视觉，不参与分数逻辑）

type BubbleType = "bubble" | "star" | "bomb";
type SnackType = "snack" | "star" | "bomb";

// rAF 循环：只负责按真实时间戳推进；卸载或结束时取消，避免循环泄漏
function useRafLoop(active: boolean, step: (now: number, dt: number) => void) {
    const stepRef = useRef(step);
    stepRef.current = step;

    useEffect(() => {
        if (!active) return;
        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = (now - last) / 1000; // 秒
            last = now;
            stepRef.current(now, dt);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [active]);
}

// 结算页：绝对定位盖在游戏区之上，半透明底 + 按钮
function ResultOverlay({
    score,
    target,
    comboMax,
    onRetry,
    onBack,
}: {
    score: number;
    target: number;
    comboMax: number;
    onRetry: () => void;
    onBack: () => void;
}) {
    const reached = score >= target;
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-950/85 backdrop-blur-sm">
            <div className="text-xs text-slate-400">本局分数 · 目标 {target}</div>
            <div className="text-3xl font-bold text-emerald-400">{score}</div>
            <div className={cn("text-sm font-medium", reached ? "text-emerald-400" : "text-amber-400")}>
                {reached ? "达标 ✔" : `差 ${target - score} 分`}
            </div>
            <div className="text-xs text-slate-400">最高连击 x{comboMax}</div>
            <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={onRetry}>
                    再玩一次
                </Button>
                {/* 必须用带显式文字色的 variant：结算浮层是深色面板，而 outline 只给背景不给文字色，
                    浅色主题下会变成"白底 + 继承来的浅色字" → 看不出字（hover 才显形）。 */}
                <Button size="sm" variant="secondary" onClick={onBack}>
                    返回
                </Button>
            </div>
        </div>
    );
}

interface Bubble {
    id: number;
    type: BubbleType;
    bornAt: number; // 生成时间戳，寿命用时间差判断
    life: number;
}

interface BubbleEffect {
    id: number;
    index: number;
    type: BubbleType;
    delta: number;
    at: number;
}

interface BubbleSnapshot {
    cells: (Bubble | null)[];
    effects: BubbleEffect[];
    score: number;
    combo: number;
    comboMax: number;
    remainMs: number;
}

// 普通泡泡必须是纯 CSS 圆点（不用 emoji，避免各端字体不一致）
function BubbleFace({ type }: { type: BubbleType }) {
    if (type === "bubble") {
        return (
            <div className="aspect-square w-1/2 max-w-[34px] rounded-full bg-gradient-to-br from-cyan-200 to-blue-500 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.35)]" />
        );
    }
    return <span className="text-lg leading-none">{type === "star" ? "⭐" : "💣"}</span>;
}

// 点中反馈：短暂高亮 + 分数飘字，纯视觉
function BubbleHitFeedback({ type, delta }: { type: BubbleType; delta: number }) {
    return (
        <>
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 animate-ping rounded-md",
                    type === "bomb" ? "bg-red-500/30" : "bg-emerald-400/30",
                )}
            />
            <span
                className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-bold",
                    delta > 0 ? "text-emerald-300" : "text-red-300",
                )}
            >
                {delta > 0 ? `+${delta}` : delta}
            </span>
        </>
    );
}

// 游戏一：戳泡泡
export function BubblePopGame({
    target,
    onFinish,
}: {
    target: number;
    onFinish: (score: number) => void;
}): JSX.Element {
    const [phase, setPhase] = useState<"playing" | "result">("playing");
    const [snapshot, setSnapshot] = useState<BubbleSnapshot>(() => ({
        cells: new Array<Bubble | null>(BUBBLE_CELL_COUNT).fill(null),
        effects: [],
        score: 0,
        combo: 0,
        comboMax: 0,
        remainMs: BUBBLE_DURATION,
    }));

    const cellsRef = useRef<(Bubble | null)[]>(new Array<Bubble | null>(BUBBLE_CELL_COUNT).fill(null));
    const effectsRef = useRef<BubbleEffect[]>([]);
    const statsRef = useRef({ score: 0, combo: 0, comboAt: 0, comboMax: 0 });
    const startAtRef = useRef(0);
    const lastSpawnRef = useRef(0);
    const idRef = useRef(0);

    const syncSnapshot = (now: number) => {
        const remainMs = Math.max(0, BUBBLE_DURATION - (now - startAtRef.current));
        setSnapshot({
            cells: [...cellsRef.current],
            effects: [...effectsRef.current],
            score: statsRef.current.score,
            combo: statsRef.current.combo,
            comboMax: statsRef.current.comboMax,
            remainMs,
        });
    };

    const spawnOne = (now: number) => {
        // 只在空格里随机挑一格；没有空格就跳过本次生成
        const empty: number[] = [];
        for (let i = 0; i < cellsRef.current.length; i++) {
            if (!cellsRef.current[i]) empty.push(i);
        }
        if (empty.length === 0) return;
        const index = empty[Math.floor(Math.random() * empty.length)];
        const roll = Math.random(); // 炸弹 10% / 星星 15% / 其余普通泡泡
        const type: BubbleType = roll < 0.1 ? "bomb" : roll < 0.25 ? "star" : "bubble";
        cellsRef.current[index] = {
            id: ++idRef.current,
            type,
            bornAt: now,
            life: type === "star" ? STAR_LIFE : type === "bomb" ? BOMB_LIFE : BUBBLE_LIFE,
        };
    };

    const resetRun = () => {
        const now = performance.now();
        cellsRef.current = new Array<Bubble | null>(BUBBLE_CELL_COUNT).fill(null);
        effectsRef.current = [];
        statsRef.current = { score: 0, combo: 0, comboAt: 0, comboMax: 0 };
        startAtRef.current = now;
        lastSpawnRef.current = now;
        idRef.current = 0;
        syncSnapshot(now);
        setPhase("playing");
    };

    // 首帧之前先把时间起点重置好，避免 elapsed 异常
    useEffect(() => {
        resetRun();
    }, []);

    useRafLoop(phase === "playing", (now) => {
        // 生成：绝对时间比较（够了就补一次），不是每帧加固定值
        while (now - lastSpawnRef.current >= BUBBLE_SPAWN_INTERVAL) {
            lastSpawnRef.current += BUBBLE_SPAWN_INTERVAL;
            spawnOne(now);
        }
        // 寿命：时间差超过 life 就自动消失
        for (let i = 0; i < cellsRef.current.length; i++) {
            const bubble = cellsRef.current[i];
            if (bubble && now - bubble.bornAt >= bubble.life) cellsRef.current[i] = null;
        }
        if (effectsRef.current.length > 0) {
            effectsRef.current = effectsRef.current.filter((effect) => now - effect.at < HIT_EFFECT_MS);
        }
        syncSnapshot(now);
        if (now - startAtRef.current >= BUBBLE_DURATION) setPhase("result");
    });

    const handleCellPointerDown = (index: number) => {
        if (phase !== "playing") return;
        const bubble = cellsRef.current[index];
        if (!bubble) return; // 点空白格 / 已消失的格子：无事发生
        const now = performance.now();
        const stats = statsRef.current;
        let delta = 0;
        if (bubble.type === "bomb") {
            delta = BUBBLE_BOMB_DELTA;
            stats.score += delta;
            stats.combo = 0; // 炸弹连击清零
        } else {
            // 连击公式照抄：窗口内且 combo > 0 才 +1，否则从 1 开始
            stats.combo =
                now - stats.comboAt <= BUBBLE_COMBO_WINDOW && stats.combo > 0 ? stats.combo + 1 : 1;
            const base = bubble.type === "star" ? BUBBLE_SCORE_STAR : BUBBLE_SCORE_NORMAL;
            const bonus = Math.min(stats.combo, 10) * 2;
            delta = base + bonus;
            stats.score += delta;
            stats.comboAt = now;
            stats.comboMax = Math.max(stats.comboMax, stats.combo);
        }
        cellsRef.current[index] = null;
        effectsRef.current = [...effectsRef.current, { id: ++idRef.current, index, type: bubble.type, delta, at: now }];
        syncSnapshot(now);
    };

    return (
        <div
            className="relative flex h-full w-full select-none flex-col overflow-hidden bg-slate-950 text-slate-100"
            style={{ touchAction: "none" }}
        >
            {/* HUD */}
            <div className="flex h-7 shrink-0 items-center justify-between gap-2 px-2 text-xs">
                <span className="text-slate-400">
                    分数 <span className="font-bold text-emerald-400">{snapshot.score}</span>
                </span>
                <span className="text-slate-400">
                    剩余 <span className="font-bold text-sky-300">{Math.ceil(snapshot.remainMs / 1000)}</span> 秒
                </span>
                <span className="text-slate-400">
                    连击 <span className="font-bold text-amber-400">x{snapshot.combo}</span>
                </span>
            </div>

            {/* 4×4 棋盘 */}
            <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1 p-1">
                {snapshot.cells.map((bubble, index) => {
                    const effect = snapshot.effects.find((item) => item.index === index);
                    return (
                        <div
                            key={index}
                            className="relative flex items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 transition-transform active:scale-95"
                            onPointerDown={() => handleCellPointerDown(index)}
                        >
                            {bubble && <BubbleFace type={bubble.type} />}
                            {effect && <BubbleHitFeedback type={effect.type} delta={effect.delta} />}
                        </div>
                    );
                })}
            </div>

            {phase === "result" && (
                <ResultOverlay
                    score={snapshot.score}
                    target={target}
                    comboMax={snapshot.comboMax}
                    onRetry={resetRun}
                    onBack={() => onFinish(snapshot.score)}
                />
            )}
        </div>
    );
}

interface SnackItem {
    id: number;
    type: SnackType;
    x: number; // 归一化横向位置 0~1
    y: number; // 归一化纵向位置 0~1
    judged: boolean; // 每件只判定一次
}

interface SnackSnapshot {
    items: SnackItem[];
    score: number;
    combo: number;
    comboMax: number;
    remainMs: number;
    basketX: number;
    basketGlow: boolean;
}

// 游戏二：接点心
export function CatchSnackGame({
    target,
    onFinish,
}: {
    target: number;
    onFinish: (score: number) => void;
}): JSX.Element {
    const [phase, setPhase] = useState<"playing" | "result">("playing");
    const [snapshot, setSnapshot] = useState<SnackSnapshot>(() => ({
        items: [],
        score: 0,
        combo: 0,
        comboMax: 0,
        remainMs: SNACK_DURATION,
        basketX: 0.5,
        basketGlow: false,
    }));

    const itemsRef = useRef<SnackItem[]>([]);
    const basketXRef = useRef(0.5);
    const statsRef = useRef({ score: 0, combo: 0, comboAt: 0, comboMax: 0 });
    const startAtRef = useRef(0);
    const lastSpawnRef = useRef(0);
    const glowAtRef = useRef(0);
    const idRef = useRef(0);

    const syncSnapshot = (now: number) => {
        const remainMs = Math.max(0, SNACK_DURATION - (now - startAtRef.current));
        setSnapshot({
            items: itemsRef.current.map((item) => ({ ...item })),
            score: statsRef.current.score,
            combo: statsRef.current.combo,
            comboMax: statsRef.current.comboMax,
            remainMs,
            basketX: basketXRef.current,
            basketGlow: now - glowAtRef.current < 200,
        });
    };

    const spawnOne = () => {
        const roll = Math.random(); // 炸弹 10% / 星星 15% / 其余点心
        const type: SnackType = roll < 0.1 ? "bomb" : roll < 0.25 ? "star" : "snack";
        itemsRef.current.push({
            id: ++idRef.current,
            type,
            x: SNACK_SPAWN_X_MIN + Math.random() * SNACK_SPAWN_X_RANGE,
            y: SNACK_START_Y,
            judged: false,
        });
    };

    // 接住 / 漏掉的结算，公式照抄
    const resolveItem = (item: SnackItem, caught: boolean, now: number) => {
        const stats = statsRef.current;
        if (item.type === "bomb") {
            if (!caught) return; // 漏掉炸弹：不影响连击
            stats.score = Math.max(0, stats.score - SNACK_BOMB_PENALTY);
            stats.combo = 0;
            glowAtRef.current = now;
            return;
        }
        if (!caught) {
            stats.combo = 0; // 漏掉点心 / 星星：连击清零
            return;
        }
        stats.combo = now - stats.comboAt <= SNACK_COMBO_WINDOW && stats.combo > 0 ? stats.combo + 1 : 1;
        const base = item.type === "star" ? SNACK_SCORE_STAR : SNACK_SCORE_SNACK;
        stats.score += base + Math.min(stats.combo, 10) * 2;
        stats.comboAt = now;
        stats.comboMax = Math.max(stats.comboMax, stats.combo);
        glowAtRef.current = now;
    };

    const resetRun = () => {
        const now = performance.now();
        itemsRef.current = [];
        basketXRef.current = 0.5;
        statsRef.current = { score: 0, combo: 0, comboAt: 0, comboMax: 0 };
        startAtRef.current = now;
        lastSpawnRef.current = now;
        glowAtRef.current = 0;
        idRef.current = 0;
        syncSnapshot(now);
        setPhase("playing");
    };

    useEffect(() => {
        resetRun();
    }, []);

    useRafLoop(phase === "playing", (now, dt) => {
        const remainMs = Math.max(0, SNACK_DURATION - (now - startAtRef.current));
        const progress = 1 - remainMs / SNACK_DURATION;
        const speed = SNACK_SPEED_FROM + progress * (SNACK_SPEED_TO - SNACK_SPEED_FROM); // 归一化“屏高/秒”
        // 生成：绝对时间比较
        while (now - lastSpawnRef.current >= SNACK_SPAWN_INTERVAL) {
            lastSpawnRef.current += SNACK_SPAWN_INTERVAL;
            spawnOne();
        }
        const basketX = basketXRef.current;
        const alive: SnackItem[] = [];
        for (const item of itemsRef.current) {
            item.y += speed * dt; // 用真实 dt 推进，不是每帧加固定值
            if (!item.judged && item.y >= SNACK_JUDGE_Y) {
                item.judged = true; // 每件只判定一次
                resolveItem(item, Math.abs(item.x - basketX) <= SNACK_CATCH_TOLERANCE, now);
            }
            if (item.judged) continue; // 判定过就离场
            if (item.y <= 1.08) alive.push(item);
        }
        itemsRef.current = alive;
        syncSnapshot(now);
        if (remainMs <= 0) setPhase("result");
    });

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = (e.clientX - rect.left) / rect.width;
        // 篮子跟随指针，夹取到 [0.02, 0.98]
        basketXRef.current = Math.max(SNACK_BASKET_CLAMP_MIN, Math.min(SNACK_BASKET_CLAMP_MAX, ratio));
    };

    return (
        <div
            className="relative h-full w-full select-none overflow-hidden bg-slate-950 text-slate-100"
            style={{ touchAction: "none" }}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
        >
            {/* HUD */}
            <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center justify-between gap-2 px-2 text-xs">
                <span className="text-slate-400">
                    分数 <span className="font-bold text-emerald-400">{snapshot.score}</span>
                </span>
                <span className="text-slate-400">
                    剩余 <span className="font-bold text-sky-300">{Math.ceil(snapshot.remainMs / 1000)}</span> 秒
                </span>
                <span className="text-slate-400">
                    连击 <span className="font-bold text-amber-400">x{snapshot.combo}</span>
                </span>
            </div>

            {/* 掉落物 */}
            {snapshot.items.map((item) => (
                <span
                    key={item.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-xl leading-none"
                    style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
                >
                    {item.type === "snack" ? "🍰" : item.type === "star" ? "⭐" : "💣"}
                </span>
            ))}

            {/* 篮子：纯 CSS 画的托盘 */}
            <div
                className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-t-sm rounded-b-2xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg",
                    snapshot.basketGlow && "ring-4 ring-emerald-300/70",
                )}
                style={{
                    left: `${snapshot.basketX * 100}%`,
                    top: `${SNACK_BASKET_Y * 100}%`,
                    width: `${SNACK_BASKET_WIDTH * 100}%`,
                    height: "7%",
                }}
            />

            {phase === "result" && (
                <ResultOverlay
                    score={snapshot.score}
                    target={target}
                    comboMax={snapshot.comboMax}
                    onRetry={resetRun}
                    onBack={() => onFinish(snapshot.score)}
                />
            )}
        </div>
    );
}