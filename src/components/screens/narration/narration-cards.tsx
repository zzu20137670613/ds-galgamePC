import { DelayedAnimatedDots } from "@/components/loading";
import { QuickTools } from "@/components/quick-tools";
import { CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNarrationPointerHandlers } from "@/lib/hooks/narration-hooks";
import { useQueryDialogue } from "@/lib/query/narration-query";
import { TextDisplaySettings } from "@/lib/stores/text-display-settings-store";
import { useSelector } from "@tanstack/react-store";
import { type RefObject, memo, useCallback, useMemo, useRef } from "react";
import Markdown from "react-markdown";
import { MarkdownTypewriterHooks } from "react-markdown-typewriter";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { narration } from "@drincs/pixi-vn";

/**
 * 背景偏暗的番外：正文强制亮色，避免黑字看不清。
 * 《一夜鱼龙舞》（灯会夜景）与《白米饭》（废墟/雨夜/夜门外/书房，四张都压得暗）。
 */
const LIGHT_TEXT_LABELS = new Set(["extra-yulongwu", "extra-baifan"]);

export function NarrationCards() {
    const { data: { character } = {} } = useQueryDialogue();
    const paragraphRef = useRef<HTMLDivElement>(null);
    const characterName = `${character?.name || ""} ${character?.surname || ""}`.trim();
    const { handlePointerDown, handlePointerCancel, handlePointerUp } =
        useNarrationPointerHandlers();

    return (
        <div className="flex h-full flex-col">
            <div className="pointer-events-none relative flex min-h-0 flex-1 flex-col gap-1 overflow-hidden rounded-xl bg-transparent">
                {/* 底层：毛玻璃，左糊右清 + 上糊下清（mask 横纵相交；顶部先留 3px 缓冲避免 blur 硬切伪影） */}
                <div
                    aria-hidden
                    className="absolute inset-0 h-full w-full backdrop-blur-sm"
                    style={{
                        maskImage:
                            "linear-gradient(to right, #000 0%, #000 25%, rgba(0,0,0,.35) 40%, rgba(0,0,0,0) 55%), linear-gradient(to bottom, rgba(0,0,0,0) 0px, #000 3px, #000 45%, rgba(0,0,0,.3) 60%, rgba(0,0,0,0) 75%)",
                        WebkitMaskImage:
                            "linear-gradient(to right, #000 0%, #000 25%, rgba(0,0,0,.35) 40%, rgba(0,0,0,0) 55%), linear-gradient(to bottom, rgba(0,0,0,0) 0px, #000 3px, #000 45%, rgba(0,0,0,.3) 60%, rgba(0,0,0,0) 75%)",
                        maskComposite: "intersect",
                        WebkitMaskComposite: "source-in",
                    }}
                />
                {/* 内容层：白底从左→右、上→下渐隐（顶部先 2px 透明缓冲避免硬切白边） */}
                <div
                    className="relative min-h-0 flex-1 flex flex-col gap-1 px-1.5 pb-1.5 py-4"
                    style={{
                        backgroundImage:
                            "linear-gradient(to bottom, rgba(255,255,255,0) 0px, rgba(255,255,255,.15) 2px, rgba(255,255,255,.08) 25%, rgba(255,255,255,0) 50%), linear-gradient(to right, rgba(255,255,255,.15) 0%, rgba(255,255,255,.08) 25%, rgba(255,255,255,0) 50%)",
                    }}
                >
                    <div className="min-h-0 flex-1">
                        <ResizablePanelGroup orientation="horizontal">
                            {character?.icon && (
                                <ResizablePanel defaultSize={"16%"}>
                                    <CharacterIcon icon={character.icon} alt={characterName} />
                                </ResizablePanel>
                            )}
                            {character?.icon && <ResizableHandle />}
                            <ResizablePanel>
                                <div className="flex h-full flex-col">
                                    <CardContent className="min-h-0 flex-1 px-3">
                                        <ScrollArea
                                            ref={paragraphRef}
                                            className="h-full"
                                            onPointerDown={handlePointerDown}
                                            onPointerCancel={handlePointerCancel}
                                            onPointerUp={handlePointerUp}
                                        >
                                            {character && (
                                                <p
                                                    className="text-xl font-bold"
                                                    style={{ color: character?.color }}
                                                >
                                                    {characterName}
                                                </p>
                                            )}
                                            <Text paragraphRef={paragraphRef} />
                                        </ScrollArea>
                                    </CardContent>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                    <QuickTools />
                </div>
            </div>
        </div>
    );
}

export const Text = memo(function Text({
    paragraphRef,
}: {
    paragraphRef: RefObject<HTMLDivElement | null>;
}) {
    const typewriterDelay = useSelector(TextDisplaySettings.store, (state) => state.delay);
    const { data: { animatedText, text } = {}, finalizeDialogue } = useQueryDialogue();
    const useLightText = LIGHT_TEXT_LABELS.has(narration.currentLabel?.id ?? "");

    const handleCharacterAnimationComplete = useCallback(
        (ref: { current: HTMLSpanElement | null }) => {
            const container = paragraphRef.current?.querySelector<HTMLElement>(
                '[data-slot="scroll-area-viewport"]',
            );
            const char = ref.current;
            if (container && char) {
                const containerRect = container.getBoundingClientRect();
                const charRect = char.getBoundingClientRect();
                const charOffsetInContainer =
                    charRect.top - containerRect.top + container.scrollTop;
                const scrollTop = charOffsetInContainer - container.clientHeight / 2;
                container.scrollTo({
                    top: scrollTop,
                    behavior: "smooth",
                });
            }
        },
        [paragraphRef],
    );

    const markdownComponents = useMemo(() => ({ p: (props: object) => <span {...props} /> }), []);

    const motionProps = useMemo(
        () => ({
            onAnimationStart: TextDisplaySettings.start,
            onAnimationComplete: (definition: "visible" | "hidden") => {
                if (definition === "visible") {
                    finalizeDialogue();
                    TextDisplaySettings.end();
                }
            },
            onCharacterAnimationComplete: handleCharacterAnimationComplete,
        }),
        [finalizeDialogue, handleCharacterAnimationComplete],
    );

    const specialCharacters = useMemo(
        () => ({
            ".": { delayAfter: typewriterDelay + 300 },
            "!": { delayAfter: typewriterDelay + 300 },
            "?": { delayAfter: typewriterDelay + 300 },
            ",": { delayAfter: typewriterDelay + 75 },
            ":": { delay: typewriterDelay + 50, delayAfter: typewriterDelay + 150 },
        }),
        [typewriterDelay],
    );

    return (
        <p
            className="prose dark:prose-invert m-0 max-w-full p-0"
            style={
                useLightText
                    ? { color: "rgba(255,255,255,.95)", textShadow: "0 1px 3px rgba(0,0,0,.9)" }
                    : undefined
            }
        >
            <span>
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                >
                    {text}
                </Markdown>
            </span>
            <span>
                <span> </span>
                <MarkdownTypewriterHooks
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    delay={typewriterDelay}
                    motionProps={motionProps}
                    fallback={<DelayedAnimatedDots />}
                    specialCharacters={specialCharacters}
                >
                    {animatedText}
                </MarkdownTypewriterHooks>
            </span>
        </p>
    );
});

export function CharacterIcon({ alt, icon }: { icon: string; alt: string }) {
    return (
        <div className="h-full w-full">
            <Image src={icon} layout="fullWidth" alt={alt} className="h-full w-full object-cover" />
        </div>
    );
}
