import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SetupStore } from "@/lib/stores/setup-store";
import {
    CONTEXT_LIMIT_OPTIONS,
    DEFAULT_CONTEXT_LIMIT,
    formatContextLimit,
    sealLimitOf,
} from "@/lib/utils/token-estimate";
import { useSelector } from "@tanstack/react-store";
import { useTranslation } from "react-i18next";

/**
 * 对话上下文：只改「记忆保护 / 封卷」的提醒阈值，不碰 API 限制。
 *
 * deepseek-flash 官方上下文是 1M，但这里刻意只给到 768k ——
 * 输入、输出、联网搜索结果共用那 1M，阈值必须留余量，
 * 否则提醒会在请求已经超限之后才出现。档位定义见 token-estimate.ts。
 */
export function ChatContextSettings() {
    const { t } = useTranslation(["ui"]);
    const contextLimit = useSelector(SetupStore.store, (state) => state.contextLimit);
    const sealLimit = formatContextLimit(sealLimitOf(contextLimit));

    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <p className="text-sm font-medium leading-none">
                    {t("chat_context_limit", { defaultValue: "上下文上限" })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {t("chat_context_limit_description", {
                        defaultValue:
                            "决定她还记得多久以前的事。档位越大，记得越久，每轮消耗的 token 也越多。",
                    })}
                </p>
            </div>
            <Select
                value={String(contextLimit)}
                onValueChange={(value) => SetupStore.setContextLimit(Number(value))}
            >
                <SelectTrigger className="w-full">
                    {/* 显式渲染展示名：value 是原始数字，直接显示会变成 55000 */}
                    <SelectValue>{formatContextLimit(contextLimit)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {CONTEXT_LIMIT_OPTIONS.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                            {formatContextLimit(value)}
                            {value === DEFAULT_CONTEXT_LIMIT
                                ? t("chat_context_limit_default", { defaultValue: "（默认）" })
                                : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                {t("chat_context_limit_hint", {
                    defaultValue: "达到约 {{seal}} 时会建议封卷；换档立即生效，不影响已有存档。",
                    seal: sealLimit,
                })}
            </p>
        </div>
    );
}