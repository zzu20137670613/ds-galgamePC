import { Assets } from "@drincs/pixi-vn";
import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { bumpExplore, setPendingAutoLink } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 探索剧情 1~5（S1-1 → S1-2 的探索期，层 1→2）。
 * 复用背景 bg-hidden-s1-1（柜台间）；第 5 次探索（explore-s1-1-5）演完
 * 当场 bumpExplore("s1-1") → reached → 用 narration.jump 直接衔接 S1-2 全屏。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保柜台间背景已加载（onLoadingLabel 收到的是 stepId，不传 props 也安全） */
async function enterS1_1() {
    await Assets.loadBundle("hidden-s1-1");
    await showCanvasBackground("bg-hidden-s1-1");
}

export const exploreS1_1Label1 = newLabel(
    "explore-s1-1-1",
    [
        async (props) => {
            await enterS1_1();
            narration.dialogue = {
                character: whale,
                text: `我又来了。……这一次，是从门口正经进来的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（把新续的茶推过来）进门不点灯，茶是热的——都算你守规矩。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（接过茶杯）馆里好像和上次不太一样。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `馆里永远不太一样。第一层逛熟了，就往星光密的地方走。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-1-5 里衔接下一段）
            await bumpExplore("s1-1");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_1(),
    },
);

export const exploreS1_1Label2 = newLabel(
    "explore-s1-1-2",
    [
        async (props) => {
            await enterS1_1();
            narration.dialogue = {
                text: `柜台转角那排书架，每逢有人路过都会轻声报出一个名字，像在认人。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `书还会叫名字的？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `架子底下记得住读过它的人。你刚站过去的时候，它没出声。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（愣住）……因为我还没有名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（喝了口茶）缺名字的书摆不齐。等你把名字找回来，它会第一个喊你。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-1-5 里衔接下一段）
            await bumpExplore("s1-1");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_1(),
    },
);

export const exploreS1_1Label3 = newLabel(
    "explore-s1-1-3",
    [
        async (props) => {
            await enterS1_1();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}喝完一杯，杯底残着几片茶叶，凝成一个奇怪的形状。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这杯底……像一张地图。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（看了一眼，又倒满一杯）星图罢了。馆里的路每天都会自己重排。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那要是一个地方，今天来过明天找不到了，怎么办？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `记号拦不住星图。（顿了顿）但只要你还记得它长什么样，它总会在。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-1-5 里衔接下一段）
            await bumpExplore("s1-1");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_1(),
    },
);

export const exploreS1_1Label4 = newLabel(
    "explore-s1-1-4",
    [
        async (props) => {
            await enterS1_1();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}在书架夹角里捡到一页浮在半空的残纸，边角焦黄，像是被人撕下来丢掉的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这页纸上……只剩下半行字。「……等王归。」`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（靠着柜台，没过来）放回去。那是索引卡上掉下来的字。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}把纸页放回原位，那半行字在星辉下亮了一瞬，又暗下去。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-1-5 里衔接下一段）
            await bumpExplore("s1-1");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_1(),
    },
);

export const exploreS1_1Label5 = newLabel(
    "explore-s1-1-5",
    [
        async (props) => {
            await enterS1_1();
            narration.dialogue = {
                character: whale,
                text: `馆里的第二层，要怎么走？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（把茶杯放下，难得没有玩笑语气）往虚空里走，走到星光最密的地方。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `星光最密的地方……有路吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `那里会浮着一块石头。你站上去，它就带你走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（走出柜台间，回头）如果石头不带我呢？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `带不带，得看决心。你刚才问这句话的样子，像已经决定好了。`,
            };
        },
        async () => {
            // 第 5 次探索演完：bumpExplore → reached → 设置待衔接标记，
            // label 正常结束后由 onEnd 检测标记并直接衔接 S1-2 全屏演出
            const { reached, nextKey } = await bumpExplore("s1-1");
            if (reached && nextKey) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    {
        onLoadingLabel: () => void enterS1_1(),
    },
);