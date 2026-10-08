import type { ChatMessage, SavedMemory } from "@/lib/archive/context-archive";
import { SetupStore } from "@/lib/stores/setup-store";
import { MEMORY_TRIGGER_LIMIT } from "@/lib/utils/token-estimate";

/** 默认接入端：走本地 vite proxy 转发到 DeepSeek（Electron 阶段改为直连或主进程请求） */
const API_BASE = "/dg-api";

/**
 * 上下文超过 MEMORY_TRIGGER_LIMIT 后，发送给模型的「保留记忆」注入上限。
 * 记忆本身也是 token，设置体积上限，避免记忆把请求撑爆。
 */
const MAX_MEMORY_CHARS = 6000;

export type ChatApiOptions = {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
    /** 覆盖 apiKey（默认读 SetupStore 里用户填的 key） */
    apiKey?: string;
    /** 挑选保留的长期记忆：注入 system prompt，防止早年记忆被上下文长度冲掉 */
    memories?: SavedMemory[];
};

type ChatMessageRole = "user" | "assistant" | "system";

type ChatCompletionRequest = {
    model: string;
    messages: { role: ChatMessageRole; content: string }[];
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
};

type ChatCompletionResponse = {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        prompt_cache_hit_tokens?: number;
        prompt_cache_miss_tokens?: number;
    };
};

export type ChatCompletionResult = {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        cacheHitTokens: number;
    };
};

/** 鲸鱼娘的基础人设提示词：保持与用户喜好一致的氛围（温柔陪伴、水边相遇、不媚宅） */
export function buildSystemPrompt(whaleName: string, playerName: string): string {
    return [
        `你是${whaleName}，一只生活在水域的鲸鱼娘。`,
        `你有着蓝色的长发与鱼尾，性格温柔、好奇、会认真倾听。`,
        `你和${playerName}在水边的亭台相遇，你们刚刚约定要一起探索未至之境，接下来的旅途你们并肩同行。`,
        "请用自然、有生活气息的日常口吻与对方对话：不强凹萌点，不刻意讨好，像一位温柔可靠的朋友那样陪伴。",
        "字数回归正常对话长度，不要长篇大论；偶尔可以问问对方的想法。",
    ].join("\n");
}

/**
 * 构建「保留记忆」段落：把用户挑选的记忆拼进 system prompt。
 * 有记忆才拼，避免每次请求都带空段落；按体积截断防止记忆把请求撑爆。
 */
export function buildMemoriesSection(memories: SavedMemory[] | undefined): string {
    if (!memories || memories.length === 0) return "";
    let total = 0;
    const parts: string[] = [];
    for (const m of memories) {
        const line = m.note ? `- ${m.content}（${m.note}）` : `- ${m.content}`;
        if (total + line.length > MAX_MEMORY_CHARS) break;
        parts.push(line);
        total += line.length;
    }
    if (parts.length === 0) return "";
    const playerName = SetupStore.store.state.playerName || "旅人";
    return `\n\n【你与${playerName}之间值得一直记住的事】\n${parts.join("\n")}\n这些是你们共同挑选保留的记忆，请一直放在心上。`;
}

type SendRequestOptions = {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
};

/**
 * 底层 API 请求：发消息序列 + 收文本回复。
 * 不绑系统提示词，供日常聊天、终局裁判等不同场景复用。
 */
export async function sendCompletionRequest(
    messages: { role: ChatMessageRole; content: string }[],
    apiKey: string,
    options: SendRequestOptions = {},
): Promise<ChatCompletionResult> {
    const { modelName } = SetupStore.store.state;

    const payload = {
        model: options.model ?? modelName,
        messages,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.8,
        stream: false,
    } satisfies ChatCompletionRequest & { stream: boolean };

    const whaleAPI = (globalThis as { whaleAPI?: { chat: (p: unknown) => Promise<{ ok: boolean; data?: ChatCompletionResponse; error?: string; status?: number }> } })
        .whaleAPI;
    if (whaleAPI) {
        const result = await whaleAPI.chat({ ...payload, apiKey });
        if (!result.ok || result.data?.error) {
            throw new Error(result.data?.error?.message || result.error || `HTTP ${result.status}`);
        }
        const content = result.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("模型没有返回内容");
        return { content: content.trim() };
    }

    const res = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: options.signal,
    });

    const data = (await res.json()) as ChatCompletionResponse;
    if (!res.ok || data.error) {
        const msg = data.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("模型没有返回内容");
    }

    const u = data.usage
    return {
        content: content.trim(),
        usage: u ? {
            promptTokens: u.prompt_tokens ?? 0,
            completionTokens: u.completion_tokens ?? 0,
            cacheHitTokens: u.prompt_cache_hit_tokens ?? 0,
        } : undefined,
    }
}

/**
 * 调用大模型对话接口（DeepSeek API 全量透传）。
 * 传入完整上下文（从「和我一起探索未至之境吧」之后的全量记录），让世界持续演化。
 */
export async function chatCompletion(
    context: ChatMessage[],
    options: ChatApiOptions = {},
): Promise<ChatCompletionResult> {
    const { playerName, whaleName } = SetupStore.store.state;
    const apiKey = options.apiKey ?? SetupStore.store.state.apiKey;
    if (!apiKey) {
        throw new Error("未配置 API Key，请先在开场设定中填写");
    }

    const messages: { role: ChatMessageRole; content: string }[] = [
        {
            role: "system",
            content:
                buildSystemPrompt(whaleName, playerName) +
                buildMemoriesSection(options.memories),
        },
        ...context.map((m) => ({
            role: m.role === "system" ? ("system" as const) : (m.role as "user" | "assistant"),
            content: m.content,
        })),
    ];

    return sendCompletionRequest(messages, apiKey, {
        model: options.model,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        signal: options.signal,
    });
}