import { dragon, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S2-1「云阶」· 天空之城（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s2-1 played → 回聊天页进入探索期（【探索天空之城】，探索 5 次衔接 S2-2）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS2_1Label = newLabel(
    "hidden-s2-1",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s2-1", "bg-hidden-s2-1");
            narration.dialogue = {
                text: `从图书馆回来那天起，${W("鲸鱼娘")}总在睡前想起那句话——「云上那位在等一位王，已经等得太久了。」她把它念到第三遍时，面前的聊天框忽然爬满了云。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `云海从屏幕里漫出来，铺满四周。一道月白的桥从云海深处垂落，不声不响架到她脚下。——是月桥。卡片上那行浮字在她耳畔响起来：「归还之日，月桥自开」。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（望着桥）……月桥。它真的开了。` };
        },
        () => {
            narration.dialogue = {
                text: `她踏上石阶。风很大，越往上走云越密、路越亮。脚下的海一点点退远，缩成一道深蓝的缝，再看不见。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（回头看了一眼海的方向，没有停）……我不回头。一回头，就舍不得走了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `楼门到了。门前空荡荡，只有一只龙盘坐在最高一级石栏上——银白的角，雪白的尾，尾巴尖一起一落，像是在数她上来了多少级台阶。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（开口，凉凉的）哦。图书馆那个书呆子把你送上来了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `声音不大，却让周围的风都安静了一瞬。这只龙一身白，从头到尾，只有眼睛是淡金色的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（仰头）……你是龙族？有人跟我说过，龙族住在云里，不爱下凡。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（尾巴尖点了点石栏）云上最后一任留守龙太子，整座城就剩我一条龙。看书呆子的面子，赏你三问——答得过，进门；答不过，哪来的，回哪去。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `三问……好。你问。` };
        },
        () => {
            narration.dialogue = { character: dragon, text: `第一个问题。你打哪来？` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（想了想）我记不太清。只记得是海的方向……图书馆那位管理员说，去云上，桥会给我开路。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `又是「有人让我来的」。这云阶上走的每一个，都说自己是被人指来的——到最后，全都成了海里的传说。`,
            };
        },
        () => {
            narration.dialogue = { character: dragon, text: `第二个问题。你来讨什么？` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `我不讨东西。我想……找回一个名字。我的名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（尾巴顿了顿）讨名字？这可比讨王座贪心多了。王座空着，至少人人都知道它空着；名字丢了的人，连自己为什么站在这儿都不知道。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（低下头）……是啊。所以我才要来。` };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音忽然低下去）第三个问题。你记得——你自己是谁吗。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `淡金色的眼瞳落下来，认真得不像刚才那只龙。四下里没有风，尾巴尖悬在半空，没有拍。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默了很久）……不记得了。只记得有人说，我身上有海的味道。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `尾巴尖轻轻落回石栏。云上静了一瞬，才听她说——`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `王座空着不可怕，可怕的是——坐上去的人，忘了自己是哪片海的。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（猛地抬头）哪片海……？` };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（不看她，望向外面的云海）云上存不住海的味道。你身上这股潮湿味，是深水养出来的——浅的地方，养不出这种东西。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（怔住）深的地方……那我是——`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（打断她，声音却软下来）你是什么，别来问我。自己下去看看，比我说的准。我这座城，只认带路的人，不认算命的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（望着她，忽然懂了）……你不是在拦我。你守这座门，等的就是这个时候。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（尾巴尖拍了两下石栏，别过头）守门的等开门的人，不差这一两千年。……呸，我话怎么这么多。进去吧——内城，王座，随便看。看完了就下来，别碰。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}迈过楼门。云层在两侧分开，一道竖直的光自天上落下——光里，城中央浮着一把空王座，扶手旁垂着一条细细的银链。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（脚步停住）那把椅子……一直没有人坐吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（盘回石栏上，声音小了下去）王座空着，不代表没人守着。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（没有答应，也没有反驳）……我会回来的。改天见。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（背过身去，尾巴尖轻轻拍了三下石栏）你打哪来回哪去都随你——海里的规矩，云上可不兴。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（极轻，几不可闻）下回见面……别空手来。把你自己带来，也算数。`,
            };
        },
        async () => {
            // 收尾：置 s2-1 played → 回聊天页进入探索期（探索天空之城）
            await markSegmentPlayed("s2-1");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s2-1" 预载
        },
    },
);