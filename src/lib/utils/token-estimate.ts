/**
 * Token 估算工具。
 *
 * 用于在把全量上下文发送给大模型之前，估算当前对话的 token 总量，
 * 以便在接近模型上下文上限时触发「记忆保留」流程。
 *
 * 估算规则（非精确计费，只用于阈值判断）：
 *  - ASCII 字符（英文/数字/符号）：约 4 字符 ≈ 1 token
 *  - 中文及其他非 ASCII 字符：约 1 字符 ≈ 0.8 token（保守取 0.7）
 *  - 换行按 1 token 计
 * 返回值可能略偏小，因此阈值（55k）本身已留出余量。
 */

/** 中文字符的正则：CJK 统一表意文字 + 全角标点 + 常用扩展区 */
const CJK_RE = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/;

/**
 * 估算一段文本的 token 数。
 * @param text 待估算文本
 * @returns 估算的 token 数（浮点，调用方可自行取整）
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    let tokens = 0;
    for (const ch of text) {
        if (ch === "\n") {
            tokens += 1;
        } else if (ch.charCodeAt(0) < 128) {
            // ASCII：4 字符约 1 token
            tokens += 0.25;
        } else if (CJK_RE.test(ch)) {
            // 中文/全角：约 1 字符 0.7 token
            tokens += 0.7;
        } else {
            // 其他 Unicode（emoji、扩展字符）：按 1 字符 1 token 保守估算
            tokens += 1;
        }
    }
    return tokens;
}

/**
 * 估算一组聊天消息的 token 总数。
 * @param messages 聊天消息数组
 * @returns 估算的 token 总数（浮点）
 */
export function estimateMessagesTokens(messages: { role?: string; content?: string }[]): number {
    let total = 0;
    for (const m of messages) {
        // 每条消息的 role 标签也占少量 token
        total += estimateTokens(m.content ?? "");
        total += 2;
    }
    return total;
}

/**
 * 对话上下文上限的默认值（token 数）。
 *
 * 注意：这里的「上限」是**玩法阈值**，不是 API 限制 —— deepseek-flash 官方上下文是 1M，
 * 估算达到该值时会触发「记忆保留」提醒，由玩家决定要不要把早期记忆收起来。
 * 默认 55k 是旧 64k 时代留下的手感，现可在「设置 → 对话上下文」里换档。
 */
export const DEFAULT_CONTEXT_LIMIT = 55_000;

/**
 * 可选档位。
 *
 * 最高只到 768k、不提供 1M：输入 + 输出 + 联网搜索结果共用官方那 1M，
 * 提醒阈值必须留出余量，否则提醒会在请求已经超限之后才出现（那轮直接报错）。
 */
export const CONTEXT_LIMIT_OPTIONS = [55_000, 128_000, 256_000, 512_000, 768_000] as const;

/**
 * 封卷提醒阈值：当前上限的 88%。
 * 半自动：仅提醒，不自动执行；用户点「封」或忽略。
 */
export function sealLimitOf(contextLimit: number): number {
    return Math.round(contextLimit * 0.88);
}

/** 档位显示：55000 → "55k"，768000 → "768k" */
export function formatContextLimit(value: number): string {
    return value >= 1_000_000 ? `${value / 1_000_000}M` : `${Math.round(value / 1000)}k`;
}