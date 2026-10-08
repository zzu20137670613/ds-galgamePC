import { dragon, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S2-2「坠落之名」· 天空之城（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s2-2 played → 回聊天页进入探索期（【探索天空之城】，探索 5 次衔接 S2-3）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS2_2Label = newLabel(
    "hidden-s2-2",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s2-2", "bg-hidden-s2-2");
            narration.dialogue = {
                text: `城南的老书阁，风在这里停住。${W("鲸鱼娘")}踩着最后一级台阶进门，满阁的纸页一起安静下来——只有中间那部翻开的巨册，还在哗啦哗啦地翻。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）……这么大一本书。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（在她身后一步远，不知什么时候跟来的，声音很淡）城南不种云，只种字。整座城的历史，都在这本册子里。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头看她一眼）你跟着我来的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没接话，尾巴尖轻轻点了点地）翻吧。来都来了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}走到巨册前。纸页停在两页之间，左页的尽头，一行字端端正正地刻着——「背叛者」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（手指悬在那三个字上方，没有落下）背叛者……？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声念出来）「云上七君之乱，守城者背城而去，坠海不返。」`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（皱眉）云上……也有过动乱？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音很轻，像在说一件和自己无关的事）很久以前了。亏得这册子还记着。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `守城者……背城而去？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `史书是这么写的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默了一下）可要是……史书写错了呢？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `纸页翻动的声音停了。整个书阁，静得能听见风在门外打转。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（半晌才开口，语气第一次不像玩笑）你凭什么觉得，它写错了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我不知道。可我在图书馆，看过一卷「流放令」——上面写，自云上下坠的人，「永不录名于天」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（顿了顿）而那份令上的名字栏，是空的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `淡金色的眼瞳，在这一刻真正地认真起来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（一字一顿）……你知道那份卷宗。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（一步步走下台阶，停在她面前两步远）我在云上数了这么多年的云，今天是第一次，有人跟我提起那份卷宗。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头与她平视）所以——册子上说的都是假的？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `不全是。动乱是真的，坠海是真的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（垂下眼，尾巴尖在地面画了一个小圈）只有「背叛」这两个字，是我写上去的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（愣住）你写的？你是史官？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `云上没有史官。城终归要留个说法给人看——总得有人，当那个「写的人」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）……那真相是什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（沉默了很久很久，久到${W("鲸鱼娘")}以为她不会再开口）是守城的那个人，自己跳下去的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（她说得很慢）她知道云上留不住那样东西——云上的人会比来比去，会把它拆了分了，会把它的名字磨掉。只有海……海收东西，不看来历。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（心头一跳）什么东西……值得她从天上跳下去？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没有回答，只是看着她，忽然笑了一下——很轻，也很苦）你猜。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（不等她回答，转身往门口走）你不是想知道自己是谁吗。答案不在云上，在册子里没写的地方。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（没有追，只站在原地）守城者坠海，带走了一样东西……那掉落的地方，是海。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（猛地抬头）她带下去的东西——是不是也沉在海底？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `小龙娘在门口停住，背着身，尾巴低低地垂着。她没有回头。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `知道为什么叫坠落、不叫下凡吗。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `——因为走得急，连回头，都来不及。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `风又起了，从塌陷的天阶缺口灌进来，吹得巨册哗哗翻了几页。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（往前走了一步）那我……该往哪里去找她留下的东西？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音很轻，几乎散在风里）云上的人以为，坠下去就没了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `其实海可比云深。海，是最记东西的地方。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（终于回头看她一眼，眼神里什么都有了，却什么都没说）……走吧。王座厅在前面，别让该等的人，等太久。`,
            };
        },
        async () => {
            // 收尾：置 s2-2 played → 回聊天页进入探索期
            await markSegmentPlayed("s2-2");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s2-2" 预载
        },
    },
);