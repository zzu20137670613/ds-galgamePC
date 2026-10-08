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
 * 探索剧情（S2-2 → S2-3 的探索期，云城 2→3 层）。
 * 复用背景 bg-hidden-s2-2（史书阁）；第 5 次探索（explore-s2-2-5）演完
 * 衔接 S2-3 全屏演出（王座厅）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保史书阁背景已加载 */
async function enterS2_2() {
    await Assets.loadBundle("hidden-s2-2");
    await showCanvasBackground("bg-hidden-s2-2");
}

export const exploreS2_2Label1 = newLabel(
    "explore-s2-2-1",
    [
        async () => {
            await enterS2_2();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}在厅外把云珀举到光里看。珀身透蓝，里面那片雾慢慢流转，像活的一样。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（指尖抚过珀面）这里面……好像有东西在动。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（不知何时又跟了出来，靠在门边）云珀里封的是一片云。云没脾气，谁养久了，就听谁的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那我现在算它的……新主人？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（别过头）嗯哼。养得起，才算。`,
            };
        },
        async () => {
            await bumpExplore("s2-2");
        },
    ],
    { onLoadingLabel: () => void enterS2_2() },
);

export const exploreS2_2Label2 = newLabel(
    "explore-s2-2-2",
    [
        async () => {
            await enterS2_2();
            narration.dialogue = {
                text: `她又走回那道光柱边，蹲下来，看着光柱那一头的深蓝。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `光柱下面……真的就是海？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（在她旁边蹲下，尾巴拖在地上）嗯。下去的时候别闭眼——海比你想象中亮。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（扭头看她）你下去过？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（安静了一会儿）……没有。云上的人，下去过一次，就够了。`,
            };
        },
        async () => {
            await bumpExplore("s2-2");
        },
    ],
    { onLoadingLabel: () => void enterS2_2() },
);

export const exploreS2_2Label3 = newLabel(
    "explore-s2-2-3",
    [
        async () => {
            await enterS2_2();
            narration.dialogue = {
                character: whale,
                text: `王座扶手上那条银链，是干什么的？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `挂钥匙的。王座的主人要在，钥匙就挂回链子上；不在，链子就一直空着。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（望着空链子）它空了……多久了？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没看她，声音平平的）比我的岁数还长。够我数完一辈子的云了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）它很快就不用空着了。`,
            };
        },
        async () => {
            await bumpExplore("s2-2");
        },
    ],
    { onLoadingLabel: () => void enterS2_2() },
);

export const exploreS2_2Label4 = newLabel(
    "explore-s2-2-4",
    [
        async () => {
            await enterS2_2();
            narration.dialogue = {
                text: `风从塌陷的天阶缺口吹进来，在空荡荡的城里打了个转。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你把城里的人都送走了，自己留在这里……不寂寞吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（嗤笑一声）寂寞什么。云会陪我数数，风会替我巡城。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（顿了顿，声音小了下去）再说了……等人的人，不能先走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（望着她，没说话，心里却牢牢记住了这句）`,
            };
        },
        async () => {
            await bumpExplore("s2-2");
        },
    ],
    { onLoadingLabel: () => void enterS2_2() },
);

export const exploreS2_2Label5 = newLabel(
    "explore-s2-2-5",
    [
        async () => {
            await enterS2_2();
            narration.dialogue = {
                character: whale,
                text: `我要下去了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（这次没有打趣，走过来，把她衣领上不知什么时候沾的一片云轻轻摘掉）……去的时候，帮我带句话给海底那位。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（点头）我会的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（站定，认真地看着她）还有一句——你自己也要记住。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `海最深的地方，不一定是深渊。也说不定，是你回家的路。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}握着云珀，向光柱迈出第一步。身后，云上那座城安静地目送着她。`,
            };
        },
        async () => {
            // 第 5 次探索演完：衔接 S2-3（王座厅）全屏演出
            const { reached, nextKey } = await bumpExplore("s2-2");
            if (reached && nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    { onLoadingLabel: () => void enterS2_2() },
);