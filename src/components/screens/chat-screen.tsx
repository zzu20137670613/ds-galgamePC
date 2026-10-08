import { contextArchive, memoryArchive, type ChatMessage, type SavedMemory } from "@/lib/archive/context-archive";
import { chatCompletion } from "@/lib/api/chat-api";
import { matchMaterials, type MaterialEntry } from "@/lib/materials/material-index";
import { clearCurrentBackground } from "@/lib/utils/assets-utility";
import {
    checkHiddenTrigger,
    currentExploreAnchor,
    getExploreCount,
    getHiddenProgress,
    setActiveHiddenLabel,
    setActiveHiddenSeqFromLabel,
    setHiddenProgress,
} from "@/lib/archive/hidden-progress";
import { matchExtraStory } from "@/lib/archive/extra-stories";
import { storyModeLabel } from "@/content/labels/story-mode.label";
import { SetupStore } from "@/lib/stores/setup-store";
import { SkipSettings } from "@/lib/stores/skip-settings-store";
import { useGameProps } from "@/lib/hooks/props-hooks";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { WhaleBalance } from "@/lib/utils/whale-balance";
import { WhaleWidget } from "@/components/WhaleWidget";
import { buildGenesisLore } from "@/lib/archive/genesis-lore";
import { Game } from "@drincs/pixi-vn";
import { useQueryClient } from "@tanstack/react-query";
import {
    LAST_SAVE_USE_QUERY_KEY,
    SAVES_USE_QUERY_KEY,
} from "@/lib/query/save-query";
import { quickSaveGameToIndexDB, getSaveSlotLabel } from "@/lib/utils/save-utility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Home, Save, ShieldCheck, LibraryBig, DoorOpen, Clapperboard, Archive } from "lucide-react";
import { estimateMessagesTokens, MEMORY_TRIGGER_LIMIT, SEAL_REMINDER_LIMIT } from "@/lib/utils/token-estimate";
import { requestFinaleJudgment, FINALE_ENDING } from "@/lib/archive/finale";
import { filterDailyMessages, runCompression, saveSealToDB, saveRawSealToDB } from "@/lib/archive/compress";
import { reviewMemoryViaAPI, reviewSealDocumentViaAPI } from "@/lib/ai-review";
import type { LabelIdType } from "@drincs/pixi-vn/narration";

/**
 * 未至之境聊天界面：
 *  - 从上下文存档续写（读取历史，不另起记录）；
 *  - 用户发言写入存档 → 调大模型（携带【探索未至之境吧】之后的全部上下文）→ 鲸鱼娘回复写入存档；
 *  - 素材映射：聊天文本命中触发词 → 切换背景 / 立绘 / 弹表情贴纸（三种形态互不干扰，各自保留最新命中）；
 *  - 隐藏剧情：发送前 checkHiddenTrigger——play → 本地入流+存档、不发 API、跳全屏演出；
 *    explore → 消息照常发 API，同时右侧弹出【探索星海图书馆】【退出星海图书馆】。
 */
export function ChatScreen() {
    const { t } = useTranslation(["ui"]);
    const gameProps = useGameProps();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const whaleName = SetupStore.store.state.whaleName || "鲸鲸";

    // ── 素材槽位状态：背景 / 立绘 / 贴纸 ──
    const [background, setBackground] = useState<string | null>("/背景/海滩假日_鲸鱼娘.png");
    const [character, setCharacter] = useState<MaterialEntry | null>(null);
    const [charRatio, setCharRatio] = useState<number | null>(null);
    const [sticker, setSticker] = useState<MaterialEntry | null>(null);
    const [stickerTs, setStickerTs] = useState<number>(Date.now());
    const [stickerFading, setStickerFading] = useState(false);
    const stickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── 长期记忆状态：用户挑选保留的记忆 / 是否已弹出 55k 提醒 ──
    const [memories, setMemories] = useState<SavedMemory[]>([]);
    /** 已触发过 55k 提醒（一次会话只提醒一次，不强制） */
    const [memoryNoticeShown, setMemoryNoticeShown] = useState(false);
    /** 已触发过 88% 封卷提醒（一次会话只提醒一次） */
    const [sealNoticeShown, setSealNoticeShown] = useState(false);
    /** 封卷进行中（禁用按钮，避免重复触发） */
    const [sealing, setSealing] = useState(false);
    const sealAbortRef = useRef<AbortController | null>(null);

    // ── 隐藏剧情·探索期状态：段演完回聊天后右侧常驻两个按钮 ──
    const [exploreAnchor, setExploreAnchor] = useState<string | null>(null);
    const [exploreOpen, setExploreOpen] = useState(false);

    /** 立绘比例：宽/高。判断为正方形或竖版（比例<1.1）时启用左对齐大立绘布局 */
    const showBanner = character !== null && charRatio !== null && charRatio < 1.1;

    /** 刷新探索期状态：锚点段 + 按钮开关 */
    const refreshExplore = async () => {
        try {
            const [anchor, progress] = await Promise.all([
                currentExploreAnchor(),
                getHiddenProgress(),
            ]);
            setExploreAnchor(anchor);
            setExploreOpen(progress.exploreOpen && anchor !== null);
        } catch (e) {
            console.error("刷新探索态失败", e);
        }
    };

    /** 探索期按钮文案：按锚点段所属场景命名（s1 星海图书馆 / s2 天空之城 / s3 亚特兰蒂斯） */
    const exploreSceneName = exploreAnchor?.startsWith("s2")
        ? "天空之城"
        : exploreAnchor?.startsWith("s3")
          ? "亚特兰蒂斯"
          : "星海图书馆";

    useEffect(() => {
        // 兜底：清掉画布上可能残留的演出背景（隐藏剧情/开场演出结束后回聊天页，
        // 若 sprite 未被引擎清干净，会和聊天页背景叠成两块→白纱重影）
        clearCurrentBackground();
        void refreshExplore();
        let cancelled = false;
        contextArchive
            .loadAll()
            .then(async (history) => {
                if (cancelled) return;
                // 首次进入：写入开场锚点（“XXX，和我一起探索未至之境吧。”），
                // 从这句话开始成为全量上下文的起点，之后只续写、不另建文件。
                if (history.length === 0 && SetupStore.store.state.onboardingDone) {
                    const { playerName, whaleName } = SetupStore.store.state;
                    const anchor: ChatMessage = {
                        role: "assistant",
                        content: `${playerName}，和我一起探索未至之境吧。`,
                        ts: Date.now(),
                        character: whaleName || "鲸鲸",
                    };
                    await contextArchive.append(anchor);
                    history = [anchor];
                }
                setMessages(history);
                setLoaded(true);
            })
            .catch((e) => {
                console.error("加载上下文失败", e);
                setLoaded(true);
            });
        // 并行加载长期记忆（与全量上下文分开存储）
        memoryArchive
            .loadAllMemories()
            .then((saved) => {
                if (!cancelled) setMemories(saved);
            })
            .catch((e) => console.error("加载记忆失败", e));

        // 外部读档（gal:archive-changed，由 loadSave 派发）后重新拉取全部上下文与探索态
        const handleArchiveChanged = () => {
            if (cancelled) return;
            void refreshExplore();
            contextArchive
                .loadAll()
                .then((history) => {
                    if (!cancelled) setMessages(history);
                })
                .catch((e) => console.error("读档后刷新上下文失败", e));
        };
        window.addEventListener("gal:archive-changed", handleArchiveChanged);
        return () => {
            cancelled = true;
            window.removeEventListener("gal:archive-changed", handleArchiveChanged);
        };
    }, []);

    useEffect(() => {
        // 组件卸载时清理贴纸定时器 + 中断进行中的封卷
        return () => {
            if (stickerTimerRef.current) {
                clearTimeout(stickerTimerRef.current);
                stickerTimerRef.current = null;
            }
            if (sealAbortRef.current) {
                sealAbortRef.current.abort();
                sealAbortRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, sending]);

    /** 扫描文本，按形态把命中的素材填进对应槽位 */
    const applyMaterials = (text: string) => {
        const hit = matchMaterials(text);
        if (!hit) return;
        switch (hit.entry.kind) {
            case "background":
                setBackground(hit.entry.src);
                break;
            case "character":
                setCharacter(hit.entry);
                setCharRatio(null); // 由 <img> onLoad 读取真实比例
                break;
            case "sticker":
                setSticker(hit.entry);
                setStickerTs(Date.now());
                setStickerFading(false);
                // 5 秒后渐隐淡出（300ms 过渡后卸载）；触发新贴纸时重置计时
                if (stickerTimerRef.current) {
                    clearTimeout(stickerTimerRef.current);
                }
                stickerTimerRef.current = setTimeout(() => {
                    setStickerFading(true);
                    stickerTimerRef.current = setTimeout(() => {
                        setSticker(null);
                        setStickerFading(false);
                        stickerTimerRef.current = null;
                    }, 300);
                }, 5000);
                break;
        }
    };

    /** 保存记忆：把一份新记忆追加进记忆列表并落盘（记忆存档，supports 明文） */
    const saveMemory = async (content: string, note?: string) => {
        if (!content.trim()) return;
        const memory: SavedMemory = {
            id: String(Date.now()),
            content: content.trim(),
            ts: Date.now(),
            note,
        };
        try {
            const review = await reviewMemoryViaAPI(memory);
            memory.apiReview = review;
        } catch (e) {
            console.error("记忆 API 审核失败", e);
        }
        const next = [...memories, memory];
        setMemories(next);
        try {
            await memoryArchive.saveMemories(next);
            const review = memory.apiReview;
            if (review && review.status === "needs_revision") {
                toast.warning(
                    t("memory_saved_review", {
                        defaultValue: `记下了，不过鲸鱼娘觉得：${review.comment}`,
                    }),
                );
            } else {
                toast.success(t("memory_saved", { defaultValue: "已把这份记忆好好收起来了。" }));
            }
        } catch (e) {
            toast.error(t("memory_save_fail", { defaultValue: "记忆没存上，再试一次？" }));
            console.error("保存记忆失败", e);
        }
    };

    /** 触发 55k 提醒：只在会话内第一次超限时插入一条系统提示卡片 */
    const maybeShowMemoryNotice = (all: ChatMessage[]) => {
        if (memoryNoticeShown) return false;
        const estimate = estimateMessagesTokens(all);
        if (estimate < MEMORY_TRIGGER_LIMIT) return false;
        setMemoryNoticeShown(true);
        return true;
    };

    /** 触发 88% 封卷提醒：达到 SEAL_REMINDER_LIMIT（≈48400）时插入建议卡片 */
    const maybeShowSealNotice = (all: ChatMessage[]) => {
        if (sealNoticeShown) return false;
        const estimate = estimateMessagesTokens(all);
        if (estimate < SEAL_REMINDER_LIMIT) return false;
        setSealNoticeShown(true);
        return true;
    };

    const handleSend = async () => {
        const content = input.trim();
        if (!content || sending) return;
        setInput("");
        const userMsg: ChatMessage = { role: "user", content, ts: Date.now() };
        // 先临时上屏，再存档；玩家发言命中素材立即生效
        const optimistic = [...messages, userMsg];
        setMessages(optimistic);
        applyMaterials(content);
        setSending(true);
        try {
            await contextArchive.append(userMsg);

            // ── 隐藏剧情触发判定（发送到 API 之前拦截）──
            // play：命中「当前 ready 段」关键词 → 本地入流+存档、不发 API、跳全屏演出；
            // explore：命中「探索锚点段」关键词 → 消息照常发 API，同时弹出右侧探索按钮。
            const hidden = await checkHiddenTrigger(content);
            if (hidden?.type === "play") {
                setSending(false);
                // 记账：隐藏剧情演出中（onEnd 据此回聊天页，不反查引擎 label）
                setActiveHiddenLabel(hidden.label);
                // 右上角【隐藏剧情 X/9】角标：进入演出即点亮
                setActiveHiddenSeqFromLabel(hidden.label);
                // 隐藏剧情演出必须逐句等待玩家点击：关闭任何遗留的自动/快进态
                SkipSettings.setEnabled(false);
                await gameProps.navigate({ to: "/game/narration" });
                await Game.start(hidden.label as LabelIdType, gameProps);
                gameProps.invalidateInterfaceData();
                return;
            }
            if (hidden?.type === "explore") {
                setExploreOpen(true);
                setExploreAnchor(await currentExploreAnchor());
            }

            // ── 番外篇触发判定（独立体系：锁死触发词、可反复触发、不沾九段主线/教程）──
            // 命中 → 本地入流+存档、不发 API、直接进全屏演出（同隐藏剧情 play 的手感）
            const extra = matchExtraStory(content);
            if (extra) {
                setSending(false);
                // 记账：番外演出中（onEnd 据此回聊天页，不反查引擎 label）
                setActiveHiddenLabel(extra.label);
                // 番外不占【隐藏剧情 X/9】角标（label 不在 9 段表中 → 序号自动落 0）
                setActiveHiddenSeqFromLabel(extra.label);
                SkipSettings.setEnabled(false);
                await gameProps.navigate({ to: "/game/narration" });
                await Game.start(extra.label as LabelIdType, gameProps);
                gameProps.invalidateInterfaceData();
                return;
            }

            const all = [...(await contextArchive.loadAll())];
            // 接近 55k 阈值时提醒用户挑选保留记忆（不强制，只在会话内提醒一次）
            if (maybeShowMemoryNotice(all)) {
                const notice: ChatMessage = {
                    role: "system",
                    content:
                        "【记忆保护提醒】我们的对话已经快到 55k 上限了，再继续下去，最早的那些记忆可能会被悄悄冲掉。要不要现在选几件你最想记住的事，我帮你好好收起来？",
                    ts: Date.now(),
                    character: whaleName,
                };
                setMessages((prev) => [...prev, notice]);
            }
            if (maybeShowSealNotice(all)) {
                const sealNotice: ChatMessage = {
                    role: "system",
                    content:
                        "【封卷建议】我们的对话已经快装不下了……要不要现在封卷，把这段旅程压成一个缩略剧本？以后还能随时打开来看。",
                    ts: Date.now(),
                    character: whaleName,
                };
                setMessages((prev) => [...prev, sealNotice]);
            }
            const chatResult = await chatCompletion(all, { memories });
            const reply: ChatMessage = {
                role: "assistant",
                content: chatResult.content,
                ts: Date.now(),
                character: whaleName,
            };
            await contextArchive.append(reply);
            setMessages((prev) => [...prev, reply]);
            // AI 回复命中素材也生效（如回复里出现"开心"切开心立绘）
            applyMaterials(chatResult.content);
            if (chatResult.usage) {
                const { modelName } = SetupStore.store.state;
                try {
                    WhaleBalance.recordTurn(
                        modelName,
                        chatResult.usage.promptTokens,
                        chatResult.usage.completionTokens,
                        chatResult.usage.cacheHitTokens,
                    );
                } catch {
                    // 账本写入失败不影响聊天流（localStorage 满等极端情况静默跳过）
                }
            }
        } catch (e) {
            const reason = e instanceof Error ? e.message : "未知错误";
            toast.error(reason);
            setMessages((prev) => prev.filter((m) => m !== userMsg));
        } finally {
            setSending(false);
        }
    };

    /** 存档按钮：快存当前进度（含对话全量上下文快照），写入快速存档槽 */
    const handleQuickSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const save = await quickSaveGameToIndexDB();
            // 同步刷新查询缓存，确保主菜单「继续」能立刻读到最新存档
            queryClient.setQueryData([SAVES_USE_QUERY_KEY, save.id], save);
            queryClient.setQueryData([LAST_SAVE_USE_QUERY_KEY], save);
            toast.success(
                `${t("success_save")}：${getSaveSlotLabel(save.id, t)}（可读档：设置 → 存档读档 → ⚡快速存档）`,
            );
        } catch (e) {
            toast.error(t("fail_save"));
            console.error("存档失败", e);
        } finally {
            setSaving(false);
        }
    };

    /** 封卷按钮：先裁判后压缩流水线 */
    const handleSeal = async () => {
        if (sealing) return;
        setSealing(true);
        const controller = new AbortController();
        sealAbortRef.current = controller;

        try {
            const all = await contextArchive.loadAll();
            const daily = filterDailyMessages(all);
            if (daily.length === 0) {
                toast.error("还没有可以封卷的聊天记录。");
                return;
            }

            const verdict = await requestFinaleJudgment(daily);

            if (verdict === "grant") {
                setBackground(FINALE_ENDING.backgroundSrc);
                setCharacter({ kind: "character", src: FINALE_ENDING.characterSrc, triggers: [] });
                toast("她答应了。", { description: "封卷完成后，这份结局会一起存进去。" });
            }

            const result = await runCompression(daily, verdict, controller.signal);

            if (result.doc) {
                try {
                    const review = await reviewSealDocumentViaAPI(result.doc);
                    result.doc.meta.apiReview = review;
                } catch (e) {
                    console.error("封卷 API 最终审核失败", e);
                }

                const entry = await saveSealToDB(result.doc, result.needsReview);

                if (verdict === "grant") {
                    const { whaleName: wn, playerName } = SetupStore.store.state;
                    const lore = buildGenesisLore(wn, playerName);
                    await contextArchive.append(lore);
                }

                if (result.needsReview) {
                    toast.warning(`封卷完成，但部分场景需要人工审核（共 ${entry.sceneCount} 个场景）`);
                } else {
                    toast.success(`封卷完成！已生成 ${entry.sceneCount} 个场景的缩略剧本。`);
                }
            } else if (result.raw) {
                const rawEntry = await saveRawSealToDB(result.raw);
                toast.warning(
                    `封卷结果结构异常，原始数据已保存为 ${rawEntry.file}，可稍后重试。`,
                );
            }
        } catch (e) {
            const isAbort = e instanceof DOMException && e.name === "AbortError";
            if (isAbort) {
                toast.info("封卷已取消。");
                return;
            }
            const reason = e instanceof Error ? e.message : "未知错误";
            toast.error(`封卷失败：${reason}`);
            console.error("封卷失败", e);
        } finally {
            sealAbortRef.current = null;
            setSealing(false);
        }
    };

    return (
        <div className="pointer-events-auto relative flex h-full w-full flex-col overflow-hidden">
            {/* 背景槽位：命中触发词即切换 */}
            <div
                className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-700"
                style={{ backgroundImage: background ? `url(${background})` : undefined }}
            />

            {/* 立绘槽位：竖版/正方形 → 主内容区左对齐大立绘；横版 → 左下角小立绘 */}

            {/* 左下角小立绘：仅横版/无立绘时保留原布局 */}
            {character && !showBanner && (
                <div className="pointer-events-none absolute bottom-40 left-4 z-10 hidden w-52 sm:block">
                    <img
                        key={character.src}
                        src={character.src}
                        alt="立绘"
                        className="w-full drop-shadow-xl animate-in fade-in zoom-in-95 duration-300"
                    />
                </div>
            )}

            {/* 顶部栏 */}
            <header className="relative z-20 flex items-center justify-between px-4 py-3 backdrop-blur-sm bg-background/40">
                <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-sky-400" />
                    <span className="font-semibold">{t("chat_title", { defaultValue: "未至之境" })}</span>
                    <span className="text-sm text-muted-foreground">
                        {t("chat_with", { defaultValue: `与 ${whaleName} 对话` })}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={handleQuickSave}
                        title={t("quick_save")}
                    >
                        <Save className="size-4" />
                        {t("save")}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            // 进入剧情模式（短引导演出）：演完由 Game.onEnd 按 onboardingDone 决定回聊天/主菜单
                            await gameProps.navigate({ to: "/game/narration" });
                            await Game.start(storyModeLabel, gameProps);
                        }}
                    >
                        <Clapperboard className="size-4" />
                        {t("enter_story_mode", { defaultValue: "进入剧情模式" })}
                    </Button>
                    {sealNoticeShown && (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={sealing}
                            onClick={handleSeal}
                            title="封卷"
                        >
                            <Archive className="size-4" />
                            {sealing ? "封卷中……" : "封卷"}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            gameProps.navigate({ to: "/" });
                        }}
                    >
                        <Home className="size-4" />
                        {t("home", { defaultValue: "主菜单" })}
                    </Button>
                </div>
            </header>

            {/* 隐藏剧情·探索按钮：段演完进入探索期后右侧常驻（层级 1~3） */}
            {exploreOpen && exploreAnchor && (
                <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
                    <Button
                        variant="secondary"
                        className="pointer-events-auto shadow-lg backdrop-blur"
                        disabled={sending}
                        onClick={async () => {
                            if (!exploreAnchor) return;
                            const count = await getExploreCount(exploreAnchor);
                            if (count >= 5) {
                                await refreshExplore();
                                return;
                            }
                            // 锚点 s1-1 → explore-s1-1-{count+1}；s1-2 → explore-s1-2-{count+1}
                            const labelId = `explore-${exploreAnchor}-${count + 1}` as LabelIdType;
                            setSending(true);
                            setActiveHiddenLabel(labelId);
                            await gameProps.navigate({ to: "/game/narration" });
                            await Game.start(labelId, gameProps);
                            gameProps.invalidateInterfaceData();
                            setSending(false);
                            await refreshExplore();
                        }}
                    >
                        <LibraryBig className="size-4" />
                        {`探索${exploreSceneName}`}
                    </Button>
                    <Button
                        variant="outline"
                        className="pointer-events-auto shadow-lg backdrop-blur"
                        onClick={async () => {
                            setExploreOpen(false);
                            try {
                                const p = await getHiddenProgress();
                                await setHiddenProgress({ ...p, exploreOpen: false });
                            } catch (e) {
                                console.error("退出探索期失败", e);
                            }
                        }}
                    >
                        <DoorOpen className="size-4" />
                        {`退出${exploreSceneName}`}
                    </Button>
                </div>
            )}

            {/* 主内容区：左侧横幅立绘 + 右侧对话框（仅竖版/正方形启用左对齐） */}
            <div className="relative z-10 flex min-h-0 flex-1">
                {/* 横幅立绘：高度自适应，宽度按比例自动，上限避免盖住对话框 */}
                {showBanner && character && (
                    <div className="pointer-events-none hidden h-full max-w-[40vw] shrink-0 sm:block">
                        <img
                            key={character.src}
                            src={character.src}
                            alt="立绘"
                            className="h-full w-auto max-w-[40vw]"
                            style={{ objectFit: "contain" }}
                            onLoad={(e) => {
                                const el = e.currentTarget;
                                if (el.naturalWidth > 0) {
                                    setCharRatio(el.naturalWidth / el.naturalHeight);
                                }
                            }}
                        />
                    </div>
                )}

                {/* 消息流 */}
                <div
                    ref={listRef}
                    className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 ${
                        showBanner ? "w-auto" : "mx-auto w-full max-w-3xl"
                    }`}
                >
                {!loaded && (
                    <div className="mx-auto text-sm text-muted-foreground">
                        {t("chat_loading", { defaultValue: "正在回到上一次的湖边……" })}
                    </div>
                )}
                {loaded && messages.length === 0 && (
                    <div className="mx-auto text-sm text-muted-foreground">
                        {t("chat_empty", { defaultValue: "还没有对话记录，对鲸鱼娘说点什么吧。" })}
                    </div>
                )}
                {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    return (
                        <div
                            key={`${m.ts}-${i}`}
                            className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                            {!isUser && sticker === null && (
                                <div className="mt-1 text-xs text-muted-foreground select-none">
                                    🐋
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                                    isUser
                                        ? "bg-sky-600 text-white rounded-br-sm"
                                        : "bg-background/80 backdrop-blur rounded-bl-sm border"
                                }`}
                            >
                                {!isUser && (
                                    <div className="mb-0.5 text-xs text-sky-500 font-medium">
                                        {m.character || whaleName}
                                    </div>
                                )}
                                {m.content}
                            </div>
                        </div>
                    );
                })}
                {sending && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl rounded-bl-sm border bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
                            正在想着怎么回答你……
                        </div>
                    </div>
                )}

                {/* 记忆卡片：想记住的事写在这里，保存后随每次对话一起带着 */}
                {memories.length > 0 || memoryNoticeShown ? (
                    <MemoryCard
                        memories={memories}
                        onSave={saveMemory}
                    />
                ) : null}

                {/* 表情贴纸槽位：最后一次命中后短暂展示，5 秒后渐隐淡出 */}
                {sticker && (
                    <div
                        key={stickerTs}
                        className={`pointer-events-none flex justify-start transition-opacity duration-300 ${
                            stickerFading ? "opacity-0" : "animate-in fade-in slide-in-from-bottom-2 duration-300"
                        }`}
                    >
                        <img
                            src={sticker.src}
                            alt="表情贴纸"
                            className="w-36 rounded-xl shadow-lg"
                        />
                    </div>
                )}
            </div>
            </div>

            {/* 输入栏 */}
            <footer className="relative z-20 border-t bg-background/40 backdrop-blur-sm">
                <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
                    <Input
                        value={input}
                        placeholder={t("chat_input_placeholder", {
                            defaultValue: `想和 ${whaleName} 说点什么……`,
                        })}
                        disabled={sending}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button onClick={handleSend} disabled={sending || !input.trim()}>
                        <Send className="size-4" />
                        {t("chat_send", { defaultValue: "发送" })}
                    </Button>
                </div>
            </footer>

            <WhaleWidget />
        </div>
    );
}

/**
 * 记忆卡片：展示已挑选保留的记忆，并支持追加一条新记忆。
 * 这些记忆会随每次对话带给鲸鱼娘，确保不因上下文变长而丢失。
 */
function MemoryCard({
    memories,
    onSave,
}: {
    memories: SavedMemory[];
    onSave: (content: string, note?: string) => void;
}) {
    const { t } = useTranslation(["ui"]);
    const [draft, setDraft] = useState("");
    const [note, setNote] = useState("");

    const handleSave = () => {
        if (!draft.trim()) return;
        onSave(draft, note.trim() || undefined);
        setDraft("");
        setNote("");
    };

    return (
        <div className="mx-auto w-full max-w-md rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sky-700">
                <ShieldCheck className="size-4" />
                <span className="text-sm font-semibold">
                    {t("memory_title", { defaultValue: "记忆盒子" })}
                </span>
                <span className="text-xs text-sky-500">
                    {t("memory_hint", {
                        defaultValue: "写下想一直记住的事，我会永远带着",
                    })}
                </span>
            </div>

            {/* 已保存的记忆列表 */}
            {memories.length > 0 && (
                <ul className="mb-3 space-y-1.5 text-sm text-sky-900">
                    {memories.map((m) => (
                        <li key={m.id} className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-sky-400">•</span>
                            <span>
                                {m.content}
                                {m.note ? (
                                    <span className="ml-1 text-xs text-sky-500">（{m.note}）</span>
                                ) : null}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {/* 追加记忆 */}
            <div className="space-y-2">
                <Input
                    value={draft}
                    placeholder={t("memory_input_placeholder", {
                        defaultValue: "比如：今天我们一起去看了海边的日落……",
                    })}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSave();
                        }
                    }}
                    className="border-sky-200 bg-white/80"
                />
                <Input
                    value={note}
                    placeholder={t("memory_note_placeholder", { defaultValue: "备注（可选）" })}
                    onChange={(e) => setNote(e.target.value)}
                    className="border-sky-200 bg-white/80 text-xs"
                />
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!draft.trim()}
                    className="w-full"
                >
                    <ShieldCheck className="size-4" />
                    {t("memory_save_btn", { defaultValue: "收进记忆盒子" })}
                </Button>
            </div>
        </div>
    );
}