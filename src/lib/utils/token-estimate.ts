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
 * 压缩开关阈值（token 数）：
 * 对话上下文估算达到该值时，触发「记忆保留」提醒卡片。
 * 55k 为 DeepSeek 上下文上限（64k）留出约 9k 余量，
 * 超过后会因超过 64k 被 API 截断而"自动丢失早期记忆"。
 */
export const MEMORY_TRIGGER_LIMIT = 55_000;

/**
 * 封卷提醒阈值（token 数）：
 * 达到 MEMORY_TRIGGER_LIMIT × 0.88 ≈ 48400 时弹出封卷建议。
 * 半自动：仅提醒，不自动执行；用户点「封」或忽略。
 */
export const SEAL_REMINDER_LIMIT = Math.round(MEMORY_TRIGGER_LIMIT * 0.88);