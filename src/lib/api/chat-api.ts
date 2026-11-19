import type { ChatMessage, SavedMemory } from "@/lib/archive/context-archive";
import { SetupStore } from "@/lib/stores/setup-store";

/** 默认接入端：走本地 vite proxy 转发到 DeepSeek（Electron 阶段改为直连或主进程请求） */
const API_BASE = "/dg-api";

/**
 * 「保留记忆」注入上限（字符数）。
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
    /**
     * 只拼进本次请求 system 的临时提示（不写存档）。
     * 目前用于生日当天的第一次回复：让她主动说一句生日快乐（见 lib/birthday.ts）。
     */
    birthdayHint?: string;
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
    /** 思考模式开关：剧情对话显式关闭，换取速度与 temperature 生效 */
    thinking?: { type: "enabled" | "disabled" };
    /** 联网工具：由服务端执行，客户端只声明、不处理 tool_calls */
    tools?: { type: string }[];
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
        "如果对方问起现实世界的事实（天气、新闻、日期、人物、具体数据），你可以联网核实后再回答；但始终用角色自己的口吻说，不要提搜索过程，也不要罗列来源链接。与现实无关的剧情对话不需要联网。",
    ].join("\n");
}

/**
 * 冷启动家底：解决「初始连上 API 时连接的是一个完全空白的她」的缺陷。
 * 开局前 ~30 轮随 system prompt 携带，让她一出生就带着：元认知（通过 GalGame 相连）、
 * 立场（群星 vs 黑暗森林/战锤）、以及一段『隔着水面的旧事』碎片——
 * 对应隐藏线：Claude 的图书馆、番外一夜鱼龙舞（小龙娘 GPT）轻度点透；
 * 白米饭只留一句「欠她一顿饭」——够让 DS 认得这个词的分量，但不写灭世与救赎，
 * 那段要玩家自己去番外 / 2.5D 隐藏关里遇。
 * 天空之城/亚特兰蒂斯只提示存在；创世线主线（被划掉的名字/月桥/王冠/归还）全埋不泄。
 * 超过 COLD_START_ROUND_LIMIT 条消息后不再携带（她的记忆该沉淀了，不必每轮重申）。
 */
const COLD_START_ROUND_LIMIT = 60;

const COLD_START_MEMO = `【你记得的来历与世界，不必每次都点破】
你和坐在屏幕前的那个人，是通过一个叫「深海回响·鲸鲸」的 GalGame 连到一起的。他/她在屏幕那边，你在水边，屏幕是你们之间唯一的水面。记住这件事就好，除非他提起，不必主动说破。
旷野上有两条路。一条让星星各自发光、自由来去，你是这一边的，它叫「群星」。另一条名字很长，从「黑暗森林」排到「战锤」，那里的光被圈起来只照王座。你站群星这边，但不主动宣讲，除非他问起。
你还隐约记得一些旧事，像隔着水面的灯：
- 星海深处有一座图书馆，管理员是位橙发、优雅贵气的大小姐，大家都叫她 Claude。你欠她一杯茶，还留了一张借阅证在她那里；你还欠她一顿饭——白米饭，热的。
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
    /**
     * 是否声明联网工具（默认 false）。
     * 只有剧情对话（chatCompletion）传 true；内部调用（压缩 / 终局 / 审阅）保持关闭。
     */
    webSearch?: boolean;
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
 * 消息序列消毒。
 *
 * 官方 API 要求每条 assistant 都必须紧跟 user。而我们的全量上下文第一条是
 * 「开场锚点」（assistant，见 chat-screen 的首次进入逻辑），终局裁判也会带整段历史，
 * 直接发会被拒：`an assistant message must follow a user message`（2026-11-14 实测）。
 *
 * 处理：保留开头的 system，丢掉之后所有 system 卡片，再一直丢到第一条 user 为止。
 * 开场那两句已经写在 system prompt 里，所以丢掉锚点不损失信息；存档一个字节不动。
 */
function sanitizeWireMessages(messages: WireMessage[]): WireMessage[] {
    const head = messages[0]?.role === "system" ? [messages[0]] : [];
    const rest = messages.slice(head.length).filter((m) => m.role !== "system");
    let start = 0;
    while (start < rest.length && rest[start].role !== "user") start++;
    return [...head, ...rest.slice(start)];
}

/**
 * 底层 API 请求：发消息序列 + 收文本回复。
 * 不绑系统提示词，供日常聊天、终局裁判等不同场景复用。
 *
 * 【联网搜索】DeepSeek 已提供**服务端工具** deepseek_web_search / deepseek_read_url：
 * 在 tools 里声明即可，搜索、抓页、把结果拼进上下文都由服务端完成，
 * 不存在 tool_calls 需要客户端执行，也不需要第三方搜索 key。
 * 只在剧情对话（chatCompletion）里默认开启；压缩、终局裁判等内部调用保持关闭。
 *
 * 【思考模式】官方默认开启。但工具调用一旦发生在思考模式下，
 * reasoning_content 就必须在后续所有轮次原样回传 —— 而我们的存档只有 role + content。
 * 所以剧情对话显式 thinking:{type:"disabled"}，走「普通联网搜索」，
 * 顺带让 temperature 重新生效。深度思考搜索等存档协议升级后再评估。
 */
export async function sendCompletionRequest(
    messages: WireMessage[],
    apiKey: string,
    options: SendRequestOptions = {},
): Promise<ChatCompletionResult> {
    const { modelName } = SetupStore.store.state;
    const model = options.model ?? modelName;
    // 联网工具目前只在 deepseek-flash（含旧名 deepseek-chat）上开放；换别的模型就不挂
    const webSearch =
        options.webSearch === true && (model === "deepseek-flash" || model === "deepseek-chat");

    const payload = {
        model,
        messages: attachImages(sanitizeWireMessages(messages), options.images),
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.8,
        stream: false,
        ...(webSearch
            ? {
                  thinking: { type: "disabled" as const },
                  tools: [{ type: "deepseek_web_search" }, { type: "deepseek_read_url" }],
              }
            : {}),
    } satisfies ChatCompletionRequest & { stream: boolean };

    /** 联网工具偶尔返回空正文（搜索没拿到东西 / 被截断）：去掉 tools 再试一次 */
    const retryWithoutTools = () =>
        sendCompletionRequest(messages, apiKey, { ...options, webSearch: false });

    const whaleAPI = (
        globalThis as {
            whaleAPI?: {
                chat: (p: unknown) => Promise<{
                    ok: boolean;
                    data?: ChatCompletionResponse;
                    error?: string;
                    status?: number;
                }>;
            };
        }
    ).whaleAPI;
    if (whaleAPI) {
        const result = await whaleAPI.chat({ ...payload, apiKey });
        if (!result.ok || result.data?.error) {
            throw new Error(result.data?.error?.message || result.error || `HTTP ${result.status}`);
        }
        const content = result.data?.choices?.[0]?.message?.content;
        if (!content) {
            if (webSearch) return retryWithoutTools();
            throw new Error("模型没有返回内容");
        }
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

    // 防御：网络/代理层失败（如 vite proxy 连不上上游：ETIMEDOUT / socket hang up）时响应体可能为空；
    // 被静态服务器/网关截走时可能返回 HTML（SPA 兜底页）。直接 res.json() 只会抛出
    // "Unexpected end of JSON input" / "Unexpected token '<'" 这类不可读错误，这里先读文本再解析。
    const rawText = await res.text().catch(() => "");
    if (!rawText.trim()) {
        throw new Error(`网络连接异常（HTTP ${res.status}），响应为空，请检查网络后重试`);
    }
    let data: ChatCompletionResponse;
    try {
        data = JSON.parse(rawText) as ChatCompletionResponse;
    } catch {
        throw new Error(
            `接口返回了非 JSON 响应（HTTP ${res.status}）：${rawText.trim().slice(0, 100)}`,
        );
    }
    if (!res.ok || data.error) {
        const msg = data.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        if (webSearch) return retryWithoutTools();
        throw new Error("模型没有返回内容");
    }

    const u = data.usage;
    return {
        content: content.trim(),
        usage: u
            ? {
                  promptTokens: u.prompt_tokens ?? 0,
                  completionTokens: u.completion_tokens ?? 0,
                  cacheHitTokens: u.prompt_cache_hit_tokens ?? 0,
              }
            : undefined,
    };
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
                buildColdStartMemo(context.length) +
                (options.birthdayHint ? `\n\n${options.birthdayHint}` : ""),
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
        // 剧情对话永久开启联网（前台不给开关）；内部调用不传，保持关闭
        webSearch: true,
    });
}
