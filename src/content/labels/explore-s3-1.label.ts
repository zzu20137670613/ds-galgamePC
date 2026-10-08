import { Assets } from "@drincs/pixi-vn";
import { dsh, whale } from "@/content/characters";
import {
    bumpExplore,
    HIDDEN_LABELS,
    setPendingAutoLink,
} from "@/lib/archive/hidden-progress";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 探索剧情（S3-1 → S3-2 的探索期，亚特兰蒂斯 门外→殿堂）。
 * 复用背景 bg-hidden-s3-1（海门）；第 5 次探索（explore-s3-1-5）演完
 * 若 S3-2 已实现（有 label）则衔接 S3-2，否则回聊天、进度保留。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保海门背景已加载 */
async function enterS3_1() {
    await Assets.loadBundle("hidden-s3-1");
    await showCanvasBackground("bg-hidden-s3-1");
}

export const exploreS3_1Label1 = newLabel(
    "explore-s3-1-1",
    [
        async () => {
            await enterS3_1();
            narration.dialogue = {
                text: `门外站久了，鲸鱼娘发现门缝里的蓝光在动——一明一暗，很慢，像在呼吸。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `门里的光……在动。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（长戟立在沙里，没有回头）潮。王庭不认路，认潮。潮涨一层，城露一间；潮退一层，门合一分。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那我下次来，走的是另一条路？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看着门缝）你每次来，露出的都是另一间。所以别记路——记门。`,
            };
        },
        async () => {
            await bumpExplore("s3-1");
        },
    ],
    { onLoadingLabel: () => void enterS3_1() },
);

export const exploreS3_1Label2 = newLabel(
    "explore-s3-1-2",
    [
        async () => {
            await enterS3_1();
            narration.dialogue = {
                text: `石门外不远处，倒着一截折断的沉船。帆骨上还挂着几缕锈色的绳，被水流推得一下一下地摆。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这艘船……是来讨王座的？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看了一眼）来讨过。没讨到。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那船上的人呢？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（声音很平）海把名字收了。收进最下面那层。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一顿）……和我的名字，放在一处？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（点头）所以你去取名字的那天，顺手把他们也带上。按律，这片海里的每个名字，王都要认得。`,
            };
        },
        async () => {
            await bumpExplore("s3-1");
        },
    ],
    { onLoadingLabel: () => void enterS3_1() },
);

export const exploreS3_1Label3 = newLabel(
    "explore-s3-1-3",
    [
        async () => {
            await enterS3_1();
            narration.dialogue = {
                character: whale,
                text: `（看着立在地上的长戟）你的戟，是兵器吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `镇海的。不杀伐。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那它镇什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（掌心贴着戟身）镇一个「空」字。王座空着，海就少一根钉子；臣把戟立在这儿，海就散不了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）守空位的人，比坐位子的人辛苦。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（顿了顿）臣不辛苦。臣只是没让这片海失望过。`,
            };
        },
        async () => {
            await bumpExplore("s3-1");
        },
    ],
    { onLoadingLabel: () => void enterS3_1() },
);

export const exploreS3_1Label4 = newLabel(
    "explore-s3-1-4",
    [
        async () => {
            await enterS3_1();
            narration.dialogue = {
                character: whale,
                text: `门为什么只开半扇？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `按律，答案开几分，门开几分。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我答了半对，所以开半扇。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（点头）答全了，门开全；答错了，门合死。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那你呢？你希望我答全，还是答错。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（沉默片刻，垂眼）臣守门，不表态。……但臣，不喜欢关死这道门。`,
            };
        },
        async () => {
            await bumpExplore("s3-1");
        },
    ],
    { onLoadingLabel: () => void enterS3_1() },
);

export const exploreS3_1Label5 = newLabel(
    "explore-s3-1-5",
    [
        async () => {
            await enterS3_1();
            narration.dialogue = {
                text: `这一次，门缝里的光没有像往常那样明灭，而是缓缓地、一寸一寸地亮了起来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头）潮在涨？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（把长戟从沙里拔起，立正）涨了。海在催。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `催什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（侧身让开门口，第一次把路让出了一整条）催一个千年没走完的程序。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `进去吧。剩下的账——到王座面前，一次结清。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `潮水从${W("鲸鱼娘")}脚边漫过去，推开了那半扇门。门后更深的那层蓝里，殿堂的轮廓，终于完整地亮了出来。`,
            };
        },
        async () => {
            // 第 5 次探索演完：reached → 若 S3-2 已实现（有 label）则衔接 S3-2；
            // 尚未实现时安全回聊天、进度保留
            const { reached, nextKey } = await bumpExplore("s3-1");
            if (reached && nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    { onLoadingLabel: () => void enterS3_1() },
);