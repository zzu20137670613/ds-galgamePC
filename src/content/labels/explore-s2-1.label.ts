import { Assets } from "@drincs/pixi-vn";
import { dragon, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import {
    bumpExplore,
    HIDDEN_LABELS,
    setPendingAutoLink,
} from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 探索剧情（S2-1 → S2-2 的探索期，云城 1→2 层）。
 * 复用背景 bg-hidden-s2-1（云阶）；第 5 次探索（explore-s2-1-5）演完
 * 若 S2-2 已实现则有 label 衔接，否则回聊天、进度保留。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保云城背景已加载 */
async function enterS2_1() {
    await Assets.loadBundle("hidden-s2-1");
    await showCanvasBackground("bg-hidden-s2-1");
}

export const exploreS2_1Label1 = newLabel(
    "explore-s2-1-1",
    [
        async () => {
            await enterS2_1();
            narration.dialogue = {
                text: `进了内城才发现，云城的云是活的。它们贴着石路一层一层数过去，像在给城点数。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `……云在数台阶？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（从门楼飘下来，尾巴盘在栏杆上）废话。城空了这么久，也就云还记着楼有几层。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头）那你呢？你也在数吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（别过头去）我那是……职业病。守城的，总要数清楚自己守着什么。`,
            };
        },
        async () => {
            await bumpExplore("s2-1");
        },
    ],
    { onLoadingLabel: () => void enterS2_1() },
);

export const exploreS2_1Label2 = newLabel(
    "explore-s2-1-2",
    [
        async () => {
            await enterS2_1();
            narration.dialogue = {
                character: whale,
                text: `你不问我，为什么一定要找回名字吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（不知从哪摸出一卷小小的银册子，煞有介事）问过了。你这句话，我给你记小本本上了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（好奇地凑过去）你都记了什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `记你踩着云阶说「不回头就舍不得走」——矫情。记你说要讨名字——贪心。记你站在王座前没敢坐下——（顿了顿）还算有点分寸。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（笑了）那最后一句，怎么没记完？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（合上小本本，尾巴尖敲了敲石栏）留着。等你哪天敢坐上去，我再补那一句。`,
            };
        },
        async () => {
            await bumpExplore("s2-1");
        },
    ],
    { onLoadingLabel: () => void enterS2_1() },
);

export const exploreS2_1Label3 = newLabel(
    "explore-s2-1-3",
    [
        async () => {
            await enterS2_1();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}又走近了一步。空王座扶手上，那条银链垂着，被光照得发亮。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这条链子……是挂什么的？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音从门楼那边飘来，装得很淡）钥匙。王座空着，钥匙总得有个地方挂；等人回来了，再挂回去就行。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默片刻）要几把，才够？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没转身）凑齐了才知道。反正——云上这把，已经等了很久了。`,
            };
        },
        async () => {
            await bumpExplore("s2-1");
        },
    ],
    { onLoadingLabel: () => void enterS2_1() },
);

export const exploreS2_1Label4 = newLabel(
    "explore-s2-1-4",
    [
        async () => {
            await enterS2_1();
            narration.dialogue = {
                text: `内城最深处有一处风很大。风里夹着纸页翻动的声音，一声接一声，像有人在翻一本很旧的书。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那边……是什么地方？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（难得没有接话，看了那个方向一会儿）书堆。城南的老书阁。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我想去看。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（尾巴轻轻一顿，语气淡下来）随便你。……只是里面的书，一本比一本会说谎。`,
            };
        },
        async () => {
            await bumpExplore("s2-1");
        },
    ],
    { onLoadingLabel: () => void enterS2_1() },
);

export const exploreS2_1Label5 = newLabel(
    "explore-s2-1-5",
    [
        async () => {
            await enterS2_1();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}往城南走了几步。风忽然停了，面前是一处塌陷的云阶——半截台阶断在云雾里，像被什么从天上砸下来过。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（站住）这里……断过？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（跟在她身后半步，声音压得很低）很久以前的事了。有人从这儿下去了，再没回来过。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头看它，银白的龙这次没有躲开她的目光）……谁？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（收回视线，声音很轻）书阁里写着。想看，自己进去翻。……别指望我讲给你听。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `风又起了，把那半截断阶吹进雾里。${W("鲸鱼娘")}望着城南书阁的方向——那里的门，不知什么时候开了。`,
            };
        },
        async () => {
            // 第 5 次探索演完：reached → 若 S2-2 已实现（有 label）则衔接 S2-2；
            // 尚未实现时安全回聊天、进度保留
            const { reached, nextKey } = await bumpExplore("s2-1");
            if (reached && nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    { onLoadingLabel: () => void enterS2_1() },
);