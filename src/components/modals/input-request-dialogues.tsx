import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { useQueryDialogue, useQueryInputValue } from "@/lib/query/narration-query";
import { rollRandomName, SetupStore } from "@/lib/stores/setup-store";
import { daysInBirthdayMonth, formatBirthday, parseBirthday } from "@/lib/birthday";
import { storyModeLabel } from "@/content/labels/story-mode.label";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { Game, narration } from "@drincs/pixi-vn";
import { Clapperboard } from "lucide-react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useSelector } from "@tanstack/react-store";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function InputRequestDialog() {
    const { data: { lastText: text } = {} } = useQueryDialogue();
    const {
        data: { isRequired, type, currentValue } = { currentValue: undefined, isRequired: false },
    } = useQueryInputValue<string | number>();
    const isTyping = useSelector(TextDisplaySettings.store, (state) => state.inProgress);
    const [open] = useDebouncedValue(!isTyping && isRequired, { wait: 50 });
    const [tempValue, setTempValue] = useState<string | number>();
    const gameProps = useGameProps();
    const { t } = useTranslation(["ui"]);

    const formMode = useSelector(SetupStore.store, (state) => state.formMode);
    const [playerName, setPlayerName] = useState(SetupStore.store.state.playerName);
    const [whaleName, setWhaleName] = useState(SetupStore.store.state.whaleName || "鲸鲸");
    const [apiKey, setApiKey] = useState(SetupStore.store.state.apiKey);
    const [modelName, setModelName] = useState(SetupStore.store.state.modelName || "deepseek-chat");
    /** 生日两段（"MM" / "DD" 字符串，空 = 没填）；提交时拼成 "MM-DD" */
    const [birthdayMonth, setBirthdayMonth] = useState("");
    const [birthdayDay, setBirthdayDay] = useState("");
    const isSetupForm = formMode === "setup";

    useEffect(() => {
        setTempValue(currentValue);
    }, [currentValue]);

    useEffect(() => {
        if (isSetupForm) {
            const state = SetupStore.store.state;
            const parsedBirthday = parseBirthday(state.birthday);
            setPlayerName(state.playerName);
            setWhaleName(state.whaleName || "鲸鲸");
            setApiKey(state.apiKey);
            setModelName(state.modelName || "deepseek-chat");
            setBirthdayMonth(parsedBirthday ? String(parsedBirthday.month) : "");
            setBirthdayDay(parsedBirthday ? String(parsedBirthday.day) : "");
        }
    }, [isSetupForm]);

    const canConfirm = tempValue !== undefined && tempValue !== "";

    const submitInputValue = useCallback(() => {
        if (!canConfirm) {
            return;
        }
        narration.inputValue = tempValue || currentValue;
        setTempValue(undefined);
        gameProps.invalidateInterfaceData();
    }, [canConfirm, currentValue, gameProps, tempValue]);

    const canConfirmSetup = whaleName.trim() !== "" && apiKey.trim() !== "";

    const submitSetupForm = useCallback(() => {
        if (!canConfirmSetup) {
            return;
        }
        SetupStore.commit({
            playerName,
            whaleName,
            apiKey,
            modelName,
            // 月、日都选了才算填了生日；只选一个视为没填（避免出现"7 月 0 日"这种半截数据）
            birthday:
                birthdayMonth && birthdayDay
                    ? formatBirthday(Number(birthdayMonth), Number(birthdayDay))
                    : "",
        });
        SetupStore.closeSetupForm();
        narration.inputValue = playerName.trim() || "旅人";
        setTempValue(undefined);
        gameProps.invalidateInterfaceData();
    }, [
        canConfirmSetup,
        playerName,
        whaleName,
        apiKey,
        modelName,
        birthdayMonth,
        birthdayDay,
        gameProps,
    ]);

    const handleRoll = useCallback(() => {
        setPlayerName(rollRandomName());
    }, []);

    return (
        <Dialog open={open}>
            <DialogContent showCloseButton={false}>
                {isSetupForm ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {t("setup_title", {
                                    defaultValue: "初次见面前，先互相了解一下吧",
                                })}
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            className="flex flex-col gap-3 py-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitSetupForm();
                            }}
                        >
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    {t("setup_player_name", {
                                        defaultValue: "怎么称呼你？",
                                    })}
                                </span>
                                <InputGroup>
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupButton
                                            type="button"
                                            onClick={handleRoll}
                                            aria-label={t("setup_roll_name", {
                                                defaultValue: "随机一个名字",
                                            })}
                                            title={t("setup_roll_name", {
                                                defaultValue: "随机一个名字",
                                            })}
                                        >
                                            🎲
                                        </InputGroupButton>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        value={playerName}
                                        placeholder={t("setup_player_name_placeholder", {
                                            defaultValue: "你的名字",
                                        })}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                    />
                                </InputGroup>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    {t("setup_whale_name", {
                                        defaultValue: "怎么称呼我？（不填的话我叫鲸鲸）",
                                    })}
                                </span>
                                <Input
                                    value={whaleName}
                                    onChange={(e) => setWhaleName(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    {t("setup_api_key", {
                                        defaultValue: "API Key（必填，后续用于世界实时演化）",
                                    })}
                                </span>
                                <Input
                                    type="password"
                                    value={apiKey}
                                    placeholder="sk-..."
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    {t("setup_model_name", {
                                        defaultValue:
                                            "模型名（不填默认 deepseek-chat，支持所有 DS 模型）",
                                    })}
                                </span>
                                <Input
                                    value={modelName}
                                    placeholder="deepseek-chat"
                                    onChange={(e) => setModelName(e.target.value)}
                                />
                            </label>
                            {/* 生日：选填，只存月日（不收集年份），见 lib/birthday.ts */}
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-muted-foreground">
                                    {t("setup_birthday", {
                                        defaultValue:
                                            "你的生日？（选填，那天会有一小段只属于你的剧情）",
                                    })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <select
                                        aria-label={t("setup_birthday_month", {
                                            defaultValue: "出生月份",
                                        })}
                                        className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                        value={birthdayMonth}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setBirthdayMonth(value);
                                            // 换月份时把超出的天数收回来（比如 1/31 切到 2 月）
                                            if (
                                                value &&
                                                birthdayDay &&
                                                Number(birthdayDay) >
                                                    daysInBirthdayMonth(Number(value))
                                            ) {
                                                setBirthdayDay(
                                                    String(daysInBirthdayMonth(Number(value))),
                                                );
                                            }
                                        }}
                                    >
                                        <option value="">不填</option>
                                        {Array.from({ length: 12 }, (_, index) => index + 1).map(
                                            (month) => (
                                                <option key={month} value={String(month)}>
                                                    {month} 月
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <select
                                        aria-label={t("setup_birthday_day", {
                                            defaultValue: "出生日期",
                                        })}
                                        className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                                        value={birthdayDay}
                                        disabled={!birthdayMonth}
                                        onChange={(e) => setBirthdayDay(e.target.value)}
                                    >
                                        <option value="">日</option>
                                        {Array.from(
                                            {
                                                length: daysInBirthdayMonth(
                                                    birthdayMonth ? Number(birthdayMonth) : 1,
                                                ),
                                            },
                                            (_, index) => index + 1,
                                        ).map((day) => (
                                            <option key={day} value={String(day)}>
                                                {day} 日
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    只存在这台设备上，不会上传，也不会问年份。
                                </span>
                            </label>
                        </form>
                        <DialogFooter>
                            <Button disabled={!canConfirmSetup} onClick={submitSetupForm}>
                                {t("setup_confirm", { defaultValue: "记下了" })}
                            </Button>
                        </DialogFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                                // 进入剧情模式：先撤掉表单态与挂起的输入请求，
                                // 否则设定弹框会继续盖在演出上（removeInputRequest 让 isRequiredInput 落 false）
                                SetupStore.closeSetupForm();
                                narration.removeInputRequest();
                                await gameProps.navigate({ to: "/game/narration" });
                                await Game.start(storyModeLabel, gameProps);
                                gameProps.invalidateInterfaceData();
                            }}
                        >
                            <Clapperboard className="size-4" />
                            {t("enter_story_mode", { defaultValue: "进入剧情模式" })}
                        </Button>
                    </>
                ) : (
                    <>
                        {text && (
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    p: (props) => <span {...props} />,
                                }}
                            >
                                {text}
                            </Markdown>
                        )}
                        <Input
                            value={tempValue ?? ""}
                            type={type}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && canConfirm) {
                                    submitInputValue();
                                }
                            }}
                            onChange={(e) => {
                                switch (e.target.type) {
                                    case "number":
                                        setTempValue(e.target.valueAsNumber);
                                        break;
                                    default:
                                        setTempValue(e.target.value);
                                }
                            }}
                        />
                        <DialogFooter>
                            <Button disabled={!canConfirm} onClick={submitInputValue}>
                                {t("confirm")}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
