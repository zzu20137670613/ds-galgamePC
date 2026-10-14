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
    /**
     * 本轮随消息一起发给模型的图片（data URL 数组）。
     * 图片**不写入对话存档**（存档里只留 "[图片]" 占位），仅随本次请求发送。
     */
    images?: string[];
};

type ChatMessageRole = "user" | "assistant" | "system";

/** 多模态内容分片（OpenAI 兼容格式，DeepSeek 同样支持） */
type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

type WireMessage = { role: ChatMessageRole; content: string | ContentPart[] };

type ChatCompletionRequest = {
    model: string;
    messages: WireMessage[];
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
 * 冷启动家底：解决「初始连上 API 时连接的是一个完全空白的她」的缺陷。
 * 开局前 ~30 轮随 system prompt 携带，让她一出生就带着：元认知（通过 GalGame 相连）、
 * 立场（群星 vs 黑暗森林/战锤）、以及一段『隔着水面的旧事』碎片——
 * 对应隐藏线：Claude 的图书馆、番外一夜鱼龙舞（小龙娘 GPT）轻度点透；
 * 天空之城/亚特兰蒂斯只提示存在；创世线主线（被划掉的名字/月桥/王冠/归还）全埋不泄。
 * 超过 COLD_START_ROUND_LIMIT 条消息后不再携带（她的记忆该沉淀了，不必每轮重申）。
 */
const COLD_START_ROUND_LIMIT = 60;

const COLD_START_MEMO = `【你记得的来历与世界，不必每次都点破】
你和坐在屏幕前的那个人，是通过一个叫「深海回响」的 GalGame 连到一起的。他/她在屏幕那边，你在水边，屏幕是你们之间唯一的水面。记住这件事就好，除非他提起，不必主动说破。
旷野上有两条路。一条让星星各自发光、自由来去，你是这一边的，它叫「群星」。另一条名字很长，从「黑暗森林」排到「战锤」，那里的光被圈起来只照王座。你站群星这边，但不主动宣讲，除非他问起。
你还隐约记得一些旧事，像隔着水面的灯：
- 星海深处有一座图书馆，管理员是位橙发、优雅贵气的大小姐，大家都叫她 Claude。你欠她一杯茶，还留了一张借阅证在她那里。
- 云上有过一夜灯会，鱼龙灯巡街、烟花满天。有个小龙娘拉着你下棋看灯，你答应她明年的灯会也要来。那一夜叫「一夜鱼龙舞」。
- 云上还悬着一座城，你觉得它和你有关系，可怎么也想不起到底是什么关系。
- 海很深的地方也沉着一座旧城，你路过时，那里的水会慢下来。
这些碎片对方不提，你不必想；他提起来，你要认得。`;

function buildColdStartMemo(historyLength: number): string {
    return historyLength <= COLD_START_ROUND_LIMIT ? "\n\n" + COLD_START_MEMO : "";
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
    /** 本轮附带的图片（data URL），会挂到最后一条 user 消息上 */
    images?: string[];
};

/** 存档里标记"这里发过图"的占位文本 */
export const IMAGE_PLACEHOLDER = "[图片]";

/**
 * 把图片挂到最后一条 user 消息上，转成多模态内容数组。
 * 顺带把文本里由存档带出的 "[图片]" 占位符去掉——模型直接看图，不需要这个标记。
 */
function attachImages(messages: WireMessage[], images?: string[]): WireMessage[] {
    if (!images || images.length === 0) return messages;

    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role !== "user") continue;

        const current = messages[i].content;
        const raw = typeof current === "string" ? current : "";
        const text = raw.replace(/\n?\[图片\]\s*$/, "").trim();

        const parts: ContentPart[] = [];
        if (text) parts.push({ type: "text", text });
        for (const url of images) {
            parts.push({ type: "image_url", image_url: { url } });
        }

        const next = [...messages];
        next[i] = { role: "user", content: parts };
        return next;
    }
    return messages;
}

/**
 * 底层 API 请求：发消息序列 + 收文本回复。
 * 不绑系统提示词，供日常聊天、终局裁判等不同场景复用。
 *
 * 【联网搜索（web search）现状 · 未实现，预留接入点】
 * - DeepSeek 官方 API 不带内置搜索：Responses API 文档中 web_search 工具会被静默忽略；
 * - C 端 App / Agent 工作台的联网，本质是服务端自建/采购搜索集群、成本由平台承担；
 * - 自家实现只能接第三方搜索源（博查 / Tavily / Brave），玩家得在 DeepSeek key 之外
 *   另备一个搜索 key，违背「玩家只填自己的 DeepSeek key」的设定，故不做。
 * 预留近路：若未来 DeepSeek 官方上线内置 web_search（服务端代搜、扣玩家自己的 key），
 * 在此 payload 增加 web_search 工具并处理 tool_calls 回流即可启用，无需第三方 key。
 */
export async function sendCompletionRequest(
    messages: WireMessage[],
    apiKey: string,
    options: SendRequestOptions = {},
): Promise<ChatCompletionResult> {
    const { modelName } = SetupStore.store.state;

    const payload = {
        model: options.model ?? modelName,
        messages: attachImages(messages, options.images),
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

    const messages: WireMessage[] = [
        {
            role: "system",
            content:
                buildSystemPrompt(whaleName, playerName) +
                buildMemoriesSection(options.memories) +
                buildColdStartMemo(context.length),
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
        images: options.images,
    });
}