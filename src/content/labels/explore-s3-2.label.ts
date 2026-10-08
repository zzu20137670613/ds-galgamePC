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
 * 探索剧情（S3-2 → S3-3 的探索期，亚特兰蒂斯 王庭正殿→加冕台）。
 * 复用背景 bg-hidden-s3-2（王庭正殿）；第 5 次探索（explore-s3-2-5）演完
 * 若 S3-3 已实现（有 label）则衔接 S3-3，否则回聊天、进度保留。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

/** 统一开场：确保王庭正殿背景已加载 */
async function enterS3_2() {
    await Assets.loadBundle("hidden-s3-2");
    await showCanvasBackground("bg-hidden-s3-2");
}

export const exploreS3_2Label1 = newLabel(
    "explore-s3-2-1",
    [
        async () => {
            await enterS3_2();
            narration.dialogue = {
                text: `殿堂四周的鲸像，每一尊都朝一个方向垂着头——不朝门口，不朝彼此，齐齐朝着那把空王座。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `它们在看王座？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（立在阶下）不是看。是朝。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `朝给谁？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `历代执戟人。臣的上一任、上上任。（顿了顿）头朝着椅子，朝了一千年——这是我们的规矩。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）也是你的规矩。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（没答，只是把头也微微向王座低了半分）嗯。`,
            };
        },
        async () => {
            await bumpExplore("s3-2");
        },
    ],
    { onLoadingLabel: () => void enterS3_2() },
);

export const exploreS3_2Label2 = newLabel(
    "explore-s3-2-2",
    [
        async () => {
            await enterS3_2();
            narration.dialogue = {
                text: `殿里的水薄薄一层，踩上去却不会湿鞋。鲸鱼娘低头，看见自己的倒影正抬头看着她。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这水……照得也太清楚了些。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `照的不是人，是心。您方才想什么，它就替您沉着什么。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（试着往前一步，倒影碎开，又慢慢拼回来）碎了……还会拼回来？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看着水面）在别处不会。在这座殿里，什么都可以拼回来。`,
            };
        },
        async () => {
            await bumpExplore("s3-2");
        },
    ],
    { onLoadingLabel: () => void enterS3_2() },
);

export const exploreS3_2Label3 = newLabel(
    "explore-s3-2-3",
    [
        async () => {
            await enterS3_2();
            narration.dialogue = {
                character: whale,
                text: `（看着王座扶手）那条链子，为什么一直挂在那儿？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `辔链。执辔的人，手不能离开王座——人可以离开，手不行。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（顿了顿）那你……按了千年？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `按的时候不多。链子在，就够了。（抬手轻碰链尾）它锁的不是王座，锁的是「守」这个字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `等我坐上去，它归谁？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看她一眼）归您想交给谁。`,
            };
        },
        async () => {
            await bumpExplore("s3-2");
        },
    ],
    { onLoadingLabel: () => void enterS3_2() },
);

export const exploreS3_2Label4 = newLabel(
    "explore-s3-2-4",
    [
        async () => {
            await enterS3_2();
            narration.dialogue = {
                text: `走到殿堂深处，声音会被放得很慢。鲸鱼娘的脚步声传出去，隔一拍才回来——回来的，像是别人的脚步。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这里的回声……好慢。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `海把话都存着。您喊一句，它要想想，才舍得还。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（想了想，轻声）……我回来了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `那句「我回来了」飘出去，过了很久很久，才轻轻落回来——落在满殿的鲸像中间，像被谁接住了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼）……它接住了。`,
            };
        },
        async () => {
            await bumpExplore("s3-2");
        },
    ],
    { onLoadingLabel: () => void enterS3_2() },
);

export const exploreS3_2Label5 = newLabel(
    "explore-s3-2-5",
    [
        async () => {
            await enterS3_2();
            narration.dialogue = {
                text: `这一次，殿里的水位动了。镜面水一层一层往下退，露出台阶上刻了很久的纹路。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（低头看着纹路）水在退。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `潮在落。潮落见底，见的是加冕台。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `要上去了吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（把辔链从扶手上一寸寸盘进掌心）臣执完最后一班。您先上，臣随后到。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `退水的声音里，那条向上的路，一级一级亮了起来。${W("鲸鱼娘")}望向路的尽头——那里还只是一片高光，什么也看不清。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `上去吧。上面，有人等了您一千年。`,
            };
        },
        async () => {
            // 第 5 次探索演完：reached → 若 S3-3 已实现（有 label）则衔接 S3-3；
            // 尚未实现时安全回聊天、进度保留
            const { reached, nextKey } = await bumpExplore("s3-2");
            if (reached && nextKey && HIDDEN_LABELS[nextKey] !== undefined) {
                setPendingAutoLink(nextKey);
            }
        },
    ],
    { onLoadingLabel: () => void enterS3_2() },
);