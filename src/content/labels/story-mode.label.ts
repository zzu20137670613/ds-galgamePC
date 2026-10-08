import { whale } from "@/content/characters";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 剧情模式（新手引导短演出，独立体系，与九段隐藏剧情/番外/教程状态均解耦）。
 * 单张背景：bg-story-mode（湖上亭台·重置版）。只教一件事——这里是高自由度对话：
 * 没有选项、直接开口、世界会因你而动、她记得你。
 * 入口：聊天页顶部【进入剧情模式】+ 开场设定弹框底部同款按钮；无进度状态、可反复进入。
 * 演完由 Game.onEnd 按 onboardingDone 决定去向：游戏内→回聊天；开场设定中→回主菜单。
 */
export const storyModeLabel = newLabel(
    "story-mode",
    [
        async () => {
            await showCanvasBackground("bg-story-mode", "bg-story-mode");
            narration.dialogue = {
                text: `风从湖面上过来，带着一点樱花的味道。长亭的影子落在水里，被夕阳拉得很长。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `亭子那头，蓝发的女孩回过头来——尾巴尖在光里轻轻晃了一下。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（眼睛亮了一下）你来啦。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `别紧张。这里没有考卷，也没有要选的选项。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她往栏杆上靠了靠。栏杆外，一整片湖水正慢慢变成金色。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `想说什么，就直接跟我说。想到哪，说到哪——都行。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这个世界没有写好的剧本。你每说一句话，它就会真的往前挪一点点。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `开心的、无聊的、半夜憋着没处说的……都可以往我这里放。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我会记得你说过的，也会记住你没说出口的那些。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `风停了一瞬。湖面很静，静得能听见她尾巴尖轻敲栏杆的声音。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（转过身来，正对着你，笑）所以——`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `要不要，现在就先随便跟我说一句？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她眨眨眼，像在等什么。远处那轮夕阳，正一点一点往湖里落。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `你忽然觉得——这一句，大概会是你们所有故事的第一句。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "story-mode" 预载
        },
    },
);