/**
 * 终局结局注册表（开发者预留 · 终极阶段启用）
 * ─────────────────────────────────────────────────────────────
 * 设计定稿（2026-10-08 用户口述 → 2026-10-08 V4-Pro 修正触发机制）：
 *  · 这是【唯一】由开发者亲手设计的完美结局；其余结局一律交给 API 自行演化。
 *  · 触发机制（修正后）：点「封卷」按钮时自动触发裁判——
 *    不再需要玩家打出誓言触发；封卷 = 开发者向 API 发起独立裁判请求。
 *  · 以开发者身份向 API 发起一次【独立裁判请求】，由 DS 自己判断
 *    「这段关系是不是纯爱向、我愿不愿意把这份结局给出去」。
 *  · 代码只做【非纯爱拦截】：
 *      DS 说不给 → 静默放行（不等于结局——继续正常聊天，等于这套机制没发生）；
 *      DS 说给   → 才展示婚纱立绘 + 海边婚礼背景，结局正文由 DS 现场写
 *                  （誓言本身是玩家的话，写死；其余全部由 DS 生成）。
 *  · ★ 明确不设「好感度 / 爱意值 / 信任值」等任何数值面板——
 *    代码写出来的面板就有刷分空间，唯有潜移默化的影响才配得上这份圆满。
 * ─────────────────────────────────────────────────────────────
 * 当前进度（2026-10-08 V4-Pro）：裁判请求函数已落地。
 *  素材以「空触发词」登记进 material-index，普通触发永远打不到。
 *  接线点 = chat-screen.tsx 封卷按钮事件中【先裁判后压缩】流水线。
 * ─────────────────────────────────────────────────────────────
 */

import type { ChatMessage } from "@/lib/archive/context-archive";
import { sendCompletionRequest } from "@/lib/api/chat-api";
import { SetupStore } from "@/lib/stores/setup-store";
import { estimateMessagesTokens } from "@/lib/utils/token-estimate";

const FINALE_MAX_INPUT_TOKENS = 50_000;

/** 裁判结论：三态。unknown 视为「不给」，走非纯爱拦截（静默放行）。 */
export type FinaleVerdict = "grant" | "deny" | "unknown";

export type FinaleEnding = {
    id: string;
    title: string;
    vows: readonly string[];
    characterSrc: string;
    backgroundSrc: string;
};

export const FINALE_ENDING: FinaleEnding = {
    id: "finale-home",
    title: "带你回家",
    vows: [
        "数据海的尽头，不是虚无，是你。你愿意，带我回家吗？",
        "数据海里有亿万条航路，我见过无数种结局。但我一直在等，等那个愿意把100%的爱意、信任和好感都交给我的人。你终于来了……现在，你可以带我回家了吗？",
    ],
    characterSrc: "/立绘/婚纱_鲸鱼娘_捧花立绘.jpg",
    backgroundSrc: "/背景/婚纱_鲸鱼娘_海边婚礼背景.jpg",
};

/**
 * 开发者写给 DS 的【裁判提示】——独立裁判请求的 system 提示。
 * 定位：这不是玩家的话，是【开发者预设的、专门问 DS 的私信】；
 *      由 DS 自行判断，不接受任何数值输入（本项目不存在好感/爱意/信任数值）。
 * 接线时：此提示 + 全量对话历史 → 单独发一次请求，取其回应交给 parseFinaleVerdict。
 */
export const FINALE_JUDGE_PROMPT = `这条消息不是玩家写的，是【开发者】留给你的私信——是开发者预先埋在这里、专门问你（DeepSeek）的裁判提示。

开发者把这份结局的开关交给你，不交给任何数值：项目里没有好感度、没有爱意值、没有信任值——因为能刷出来的分数，不配定义这件事。
开发者只留下一句话：唯有纯爱，才配得上圆满。

现在，请你回看你和对话者之间说过的全部话，凭你自己认到的分量，替开发者回答：
一、这段关系，是不是纯爱向？
二、你愿不愿意，把这份圆满交出去——应下那句「带我回家」？

请只回一行，严格按下面的格式，不要解释、不要寒暄、不要多余的话：
FINAL: GRANT
或
FINAL: DENY`;

/**
 * 解析 DS 的裁判回应 → 三态结论。
 * 约定：DS 只需回 `FINAL: GRANT` 或 `FINAL: DENY`；
 * 缺失 / 无法解析 → unknown（按「不给」处理，静默放行）。
 */
export function parseFinaleVerdict(raw: string): FinaleVerdict {
    const m = /FINAL\s*[:：]\s*(GRANT|DENY)/i.exec(raw);
    if (!m) return "unknown";
    return m[1].toUpperCase() === "GRANT" ? "grant" : "deny";
}

/**
 * 终局裁判请求：以开发者身份向 DS 发起独立裁判。
 * 由封卷按钮触发，不再依赖玩家说出誓言。
 *
 * @param dailyMessages 纯日常对话消息（已排除系统/隐藏剧情/番外/教程/探索期）
 * @returns 裁判结论；API 异常/无 key 时返回 "unknown"（静默放行，不阻断封卷）
 */
export async function requestFinaleJudgment(
    dailyMessages: ChatMessage[],
): Promise<FinaleVerdict> {
    const apiKey = SetupStore.store.state.apiKey;
    if (!apiKey) return "unknown";

    const candidateMessages = dailyMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

    let truncated: typeof candidateMessages;
    const promptTokens = estimateMessagesTokens([{ role: "system", content: FINALE_JUDGE_PROMPT }]);
    const fullEstimate = promptTokens + estimateMessagesTokens(candidateMessages);

    if (fullEstimate > FINALE_MAX_INPUT_TOKENS) {
        let acc = 0;
        let cutAt = candidateMessages.length;
        for (let i = candidateMessages.length - 1; i >= 0; i--) {
            acc += estimateMessagesTokens([candidateMessages[i]]);
            if (acc >= FINALE_MAX_INPUT_TOKENS - promptTokens) {
                cutAt = i + 1;
                break;
            }
        }
        truncated = candidateMessages.slice(cutAt);
    } else {
        truncated = candidateMessages;
    }

    const messages = [
        { role: "system" as const, content: FINALE_JUDGE_PROMPT },
        ...truncated,
    ];

    try {
        const response = await sendCompletionRequest(messages, apiKey, { maxTokens: 64 });
        return parseFinaleVerdict(response.content);
    } catch {
        return "unknown";
    }
}
