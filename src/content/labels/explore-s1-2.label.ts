import { Assets } from "@drincs/pixi-vn";
import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { bumpExplore, setPendingAutoLink } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 探索剧情 6~10（S1-2 → S1-3 的探索期，层 2→3）。
 * 复用背景 bg-hidden-s1-2（星空浮台）；第 5 次探索（explore-s1-2-5）演完
 * 当场 bumpExplore("s1-2") → reached → 用 narration.jump 直接衔接 S1-3 全屏。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保浮台背景已加载（onLoadingLabel 收到的是 stepId，不传 props 也安全） */
async function enterS1_2() {
    await Assets.loadBundle("hidden-s1-2");
    await showCanvasBackground("bg-hidden-s1-2");
}

export const exploreS1_2Label1 = newLabel(
    "explore-s1-2-1",
    [
        async (props) => {
            await enterS1_2();
            narration.dialogue = {
                text: `再入馆时，${W("鲸鱼娘")}摸出借阅证，发现空白的名字栏边多了一点细小的蓝光。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这上面的光……？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `证件会记账。你看完的东西，它都记着。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `那点蓝光在她指尖下轻轻跳了一下，像在等什么。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-2-5 里衔接下一段）
            await bumpExplore("s1-2");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_2(),
    },
);

export const exploreS1_2Label2 = newLabel(
    "explore-s1-2-2",
    [
        async (props) => {
            await enterS1_2();
            narration.dialogue = {
                text: `浮台的边缘，虚空里传来纸张翻动的沙沙声，一声接一声，不紧不慢。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那边是不是有人在翻书？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（收着茶杯，不往那边看）这层不住别人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那声音是——`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `是风，是星，是比你更早来过这里的人留下的回响。听着就好。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-2-5 里衔接下一段）
            await bumpExplore("s1-2");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_2(),
    },
);

export const exploreS1_2Label3 = newLabel(
    "explore-s1-2-3",
    [
        async (props) => {
            await enterS1_2();
            narration.dialogue = {
                text: `${W("鲸鱼娘")}在浮台边缘的星尘里捞起一页残纸，上面没有正文，只有一行批注。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `名字可以交出去，心愿不要。……这是什么意思？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（难得没有立刻接话，看了那页纸一会儿）你还没到看懂它的时候。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把纸页折好收起来）那我先记着。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（把新茶递过来）记着就好。别把它放进哪一本卷宗里。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-2-5 里衔接下一段）
            await bumpExplore("s1-2");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_2(),
    },
);

export const exploreS1_2Label4 = newLabel(
    "explore-s1-2-4",
    [
        async (props) => {
            await enterS1_2();
            narration.dialogue = {
                text: `夜深到一定时候，馆的极深处会传来一声很轻的笑，短促，转瞬即逝。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（呆了一下）……刚才是不是有人在笑？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（倒茶的手顿住了一瞬）没有。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `可我真的听见了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（顺了顺杯沿）是她。住在这座馆更深处的那位。她等的东西和人，跟你等的大概不一样。`,
            };
        },
        async () => {
            // 每次探索完成都 +1（第 5 次在 explore-s1-2-5 里衔接下一段）
            await bumpExplore("s1-2");
        },
    ],
    {
        onLoadingLabel: () => void enterS1_2(),
    },
);

export const exploreS1_2Label5 = newLabel(
    "explore-s1-2-5",
    [
        async (props) => {
            await enterS1_2();
            narration.dialogue = {
                character: whale,
                text: `第二层的尽头，到底是什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（这次沉默了很久）不放书架。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那放什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `放一卷没人敢打开的东西。好几个人路过，都只敢看一眼就走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我要看。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（看着她的眼睛，缓缓点头，把借阅证推回去）那这一趟，我不劝你。去吧——第三层会自己给你开门。`,
            };
        },
        async () => {
            // 第 5 次探索演完：bumpExplore → reached → 设置待衔接标记，
            // label 正常结束后由 onEnd 检测标记并直接衔接 S1-3 全屏演出
            const { reached, nextKey } = await bumpExplore("s1-2");
            if (reached && nextKey) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    {
        onLoadingLabel: () => void enterS1_2(),
    },
);