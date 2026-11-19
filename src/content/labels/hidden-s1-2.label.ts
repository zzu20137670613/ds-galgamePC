import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S1-2「索引规则」· 星空浮台（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s1-2 played → 回聊天页进入探索期（探索 6~10）。
 * 【探索】第 5 次演完由 explore-s1-2-5 衔接本段。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS1_2Label = newLabel(
    "hidden-s1-2",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s1-2", "bg-hidden-s1-2");
            narration.dialogue = {
                text: `${W("鲸鱼娘")}踏上浮石，星辉往两边分开——回过神时，她已经站在一座石台上。四周是无尽深空，脚下是石质长案。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（打量四周）……这就是第二层？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（已经在案边，把倒好的茶推过来）来得比我预想快。第一层没那么好走，看来你是真的想找回名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（接过茶，看向案上）案上这两张纸，是……？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `你问的。第一层尽头那页残纸，我替你收好了——它还有兄弟姐妹，都在这儿。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `案上摊着两张泛黄的残纸，边角焦痕，显然是从同一张上撕下来的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `……这是同一张卡片的两角。中间还缺一块。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `缺的那块，就是当初被划掉的部分。先看能看清的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（拿起第一张，轻声读）「曾在云上与龙族同席」。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `龙族？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `远在天上的一家，住在云里，不爱下凡。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `我和龙族……同过席？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `字是这么写的。卡片不会替你记错，只会替你记得太少。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}放下第一张，拿起第二张，指尖微微顿住。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `「朝深海退位，王冠寄放」。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `深海……退位……？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（喝了口茶）王冠这种东西，一般不会随便寄放。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `那寄放给谁？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `卡片上没写。但能被寄放王冠的人，多半是守得住东西的人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（放下第二张）这两行，我一点印象都没有。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `正常。你当初亲手把记忆锁进这张卡片底下，再一张张撕开丢出去，就是不想让自己想起来。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `……我为什么要这么做？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（茶杯转了半圈）可能因为，有些记得比忘记更重。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `第三张残纸放在案角，蛀蚀得最严重，边缘焦黑，只剩一行字的尾巴。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这第三张……只剩下「……等王归」三个字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `那是整张卡片的落款。谁归来了，谁就是这行字等的人。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（抬头）你在说我。` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（没有否认，垂眼吹了吹茶雾）卡片自己选的。馆里只收被人看清过的东西——这三行字还能看清，说明它们认你做过主人。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}盯着焦痕半晌，那行残字忽然亮了一瞬，像被星光照透，浮出一行新的字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（愣住）卡片上……长出了新的字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（倾身看了一眼）「归还之日，月桥自开」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `月桥——是通往哪里的桥？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `云上。云上有一座城，城门口有一座桥，只在月亮归位的时候开放。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `月亮归位……` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `意思是，该回去的人，桥会替她开好路。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把三张残纸按顺序放回案上）我要去云上。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（端起茶盘，看着她）去之前，把这层也逛熟。名字不是一天找回来的，路也不是一步走完的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（点头，把新浮的那行字记在心里）那……这层的尽头在哪里？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（走到石台边缘，往虚空深处看了一眼）第二层的尽头不放书架。放一卷没人敢打开的东西。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（捏紧茶杯，又松开）我知道了。`,
            };
        },
        () => {
            narration.dialogue = { character: claude, text: `知道就好。改天见，访客。` };
        },
        async () => {
            // 收尾：置 s1-2 played → 回聊天页进入探索期（探索 6~10）
            await markSegmentPlayed("s1-2");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s1-2" 预载
        },
    },
);