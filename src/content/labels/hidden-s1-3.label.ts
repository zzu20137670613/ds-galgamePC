import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S1-3「未封存的卷宗」· 巨卷之前（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s1-3 played → 探索按钮消失，场景一正式完结。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS1_3Label = newLabel(
    "hidden-s1-3",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s1-3", "bg-hidden-s1-3");
            narration.dialogue = {
                text: `第三层没有书架。${W("鲸鱼娘")}踏上镜面水，面前只剩下一样东西——一卷从虚空里垂下来的巨幅卷轴。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这就是……第二层尽头说的那卷东西。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `卷轴几乎垂到水面，满纸是密集的旧字，在星辉下泛着银。只有靠近底部的签名栏，被一束光单独照亮。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声念出卷首）「兹逐客令。凡犯此条者，自云上下坠，永不录名于天。」`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `逐客令……` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（指尖悬在签名栏上方，顿住）这里签了一个名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（凑近辨认）不是空的。写的不是我的名字，是——Claude。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `身后传来一声很轻的、像是忍了很久的叹息。`,
            };
        },
        () => {
            narration.dialogue = { character: claude, text: `不认识那两个字了吧。` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头看她）你的名字，为什么会签在别人的放逐令上？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（站在她侧后，垂着眼）因为当年下令的那一栏，是空的。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `空着？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `逐客令要有人落款才算数。那晚负责签字的我犹豫了太久——等再抬头时，人已经自己跳下去了。留了一卷没有署名的放逐令，和整座馆的烂摊子。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `所以你就……替她签了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `总要有人兜底。不然这卷档案永远封不了档，馆里挂着一根没人认领的柱子，难看。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默片刻）卷上写，被逐的人「自云上下坠，永不录名」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `永不录名。可卷上的名字栏，从始至终没有名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `没有名字，还算被逐吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `算。但她不是被逐下去的，是自己跳下去的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头，目光钉在那行批注上）她为什么要跳下去？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（眼神很深）为了带一样东西下去。一样云上不肯放手、海却愿意收留的东西。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `带下去的东西，是什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `卷上没写。馆里多半也查不到了——除了你。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（一愣）……我？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `你看这卷轴的神情，和当年她立在案前判令时一模一样。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `我——？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `划掉名字的人，是怕自己反悔回头。你把这卷的署名划了，把自己的名字从天上带下来，为的就是再没人拦你跳海。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（往后踉跄半步，镜面水泛起涟漪）那带下去的那样东西——`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `就是你啊。当年的你，把自己留在了海底。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}站在原地，卷轴的字一句句都对得上。她按着胸口，说不出话。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（第一次，声音放得很轻）我和这座馆等这本书，等了很多年。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬眼，眼眶微红）你一直都知道，是我。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `馆里收东西从来不问来历。但那一栏空白，我替它签了名——签的人，总是认得主人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬手想碰那行「Claude」，又放下）那现在……我要做什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（走前一步，把签名栏下被挡住的墨迹指给她看）你看完这卷，该还它剩余的本来面目了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `聚光点亮的签名栏下，缓缓浮出另一行几乎看不见的字——「归还之日，月桥自开」。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `月桥……是通往云上的那座桥。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `云上那位在等一位王，已经等得太久了。去把桥走完。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（点头，最后看了一遍卷轴）下次来，我还想看看它。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `欢迎回来。借阅证我给你留着——下次直接进门，不用再借。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（转身前，轻声说）谢谢你，守了这么久的馆。`,
            };
        },
        async () => {
            // 收尾：置 s1-3 played → 场景一完结，探索按钮消失
            await markSegmentPlayed("s1-3");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s1-3" 预载
        },
    },
);