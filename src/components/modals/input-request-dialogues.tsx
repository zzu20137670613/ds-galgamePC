import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    const isSetupForm = formMode === "setup";

    useEffect(() => {
        setTempValue(currentValue);
    }, [currentValue]);

    useEffect(() => {
        if (isSetupForm) {
            const state = SetupStore.store.state;
            setPlayerName(state.playerName);
            setWhaleName(state.whaleName || "鲸鲸");
            setApiKey(state.apiKey);
            setModelName(state.modelName || "deepseek-chat");
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
        SetupStore.commit({ playerName, whaleName, apiKey, modelName });
        SetupStore.closeSetupForm();
        narration.inputValue = playerName.trim() || "旅人";
        setTempValue(undefined);
        gameProps.invalidateInterfaceData();
    }, [canConfirmSetup, playerName, whaleName, apiKey, modelName, gameProps]);

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
                                        defaultValue: "模型名（不填默认 deepseek-chat，支持所有 DS 模型）",
                                    })}
                                </span>
                                <Input
                                    value={modelName}
                                    placeholder="deepseek-chat"
                                    onChange={(e) => setModelName(e.target.value)}
                                />
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