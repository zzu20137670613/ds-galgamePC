import type { SavedMemory } from "@/lib/archive/context-archive";
import type { SealDocument } from "@/lib/archive/compress";
import { sendCompletionRequest } from "@/lib/api/chat-api";
import { SetupStore } from "@/lib/stores/setup-store";

export type ReviewResult = {
    status: "approved" | "needs_revision";
    comment: string;
    reviewedAt: number;
};

const MEMORY_REVIEW_PROMPT = `你是记忆审核员。用户在角色扮演对话中挑选了一条想要永久保留的记忆。
请审核这条记忆是否值得保留：

1. 内容是否具有情感价值或叙事意义（而非无关紧要的寒暄）
2. 是否捕捉了对话中的关键转折、重要约定、或情感共鸣时刻
3. 是否过于琐碎或随意

请只返回 JSON，不要其他文字：
{"status":"approved","comment":"审核评语（中文，解释为什么通过或需要修改）"}
或
{"status":"needs_revision","comment":"审核评语（说明哪里需要调整）"}`;

const SEAL_REVIEW_PROMPT = `你是剧本质量审核员。以下是一份由 API 自动生成的对话缩略剧本 + 游戏映射层摘要。

请进行最终共创审核：

1. 场景之间的连贯性是否合理自然
2. 关键事件是否抓住了对话的核心转折点
3. 游戏映射（敌人配置/boss/隐藏要素）是否贴合对应场景的氛围
4. 整体是否可以作为 2.5D 俯视射击游戏的关卡设计参考

请只返回 JSON，不要其他文字：
{"status":"approved","comment":"审核评语（中文，解释整体质量评价）"}
或
{"status":"needs_revision","comment":"审核评语（说明哪里需要重跑或人工修正）"}`;

function parseReviewResult(raw: string): ReviewResult {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("未找到 JSON");
        const parsed = JSON.parse(jsonMatch[0]);
        const status = parsed.status === "needs_revision" ? "needs_revision" : "approved";
        return {
            status,
            comment: String(parsed.comment ?? ""),
            reviewedAt: Date.now(),
        };
    } catch {
        return {
            status: "approved",
            comment: "API 审核解析失败，默认通过（请手动检查）",
            reviewedAt: Date.now(),
        };
    }
}

function getApiKey(): string | null {
    return SetupStore.store.state.apiKey || null;
}

export async function reviewMemoryViaAPI(memory: SavedMemory): Promise<ReviewResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            status: "approved",
            comment: "未配置 API Key，跳过审核（以代码校验为准）",
            reviewedAt: Date.now(),
        };
    }

    const promptText = [
        `记忆内容：${memory.content}`,
        memory.note ? `玩家备注：${memory.note}` : "",
    ]
        .filter(Boolean)
        .join("\n");

    try {
        const response = await sendCompletionRequest(
            [
                { role: "system", content: MEMORY_REVIEW_PROMPT },
                { role: "user", content: promptText },
            ],
            apiKey,
            { maxTokens: 512, temperature: 0.3 },
        );
        return parseReviewResult(response.content);
    } catch (e) {
        console.error("记忆 API 审核失败", e);
        return {
            status: "approved",
            comment: `API 审核请求失败（${e instanceof Error ? e.message : "未知错误"}），默认通过`,
            reviewedAt: Date.now(),
        };
    }
}

export async function reviewSealDocumentViaAPI(doc: SealDocument): Promise<ReviewResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            status: "approved",
            comment: "未配置 API Key，跳过审核（以代码校验为准）",
            reviewedAt: Date.now(),
        };
    }

    const sceneSummaries = doc.scenes
        .map((s, i) => {
            const events = s.关键事件.length > 0 ? s.关键事件.join("；") : "（无关键事件）";
            const tone = s.情感基调 || "未标注";
            return `场景${i + 1}「${s.场景名}」[${s.sceneType}]：${tone}。事件：${events}`;
        })
        .join("\n");

    const summary = [
        `场景数：${doc.scenes.length}`,
        `终局判定：${doc.meta.终局判定}`,
        `场景列表：`,
        sceneSummaries,
    ].join("\n");

    try {
        const response = await sendCompletionRequest(
            [
                { role: "system", content: SEAL_REVIEW_PROMPT },
                { role: "user", content: summary },
            ],
            apiKey,
            { maxTokens: 1024, temperature: 0.3 },
        );
        return parseReviewResult(response.content);
    } catch (e) {
        console.error("封卷 API 审核失败", e);
        return {
            status: "approved",
            comment: `API 审核请求失败（${e instanceof Error ? e.message : "未知错误"}），默认通过`,
            reviewedAt: Date.now(),
        };
    }
}