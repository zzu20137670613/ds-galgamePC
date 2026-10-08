import { dragon, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S2-3「王座之前」· 天空之城（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s2-3 played → 场景二完结（三物：月桥钥匙 / 借阅证 / 云珀 集齐）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS2_3Label = newLabel(
    "hidden-s2-3",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s2-3", "bg-hidden-s2-3");
            narration.dialogue = {
                text: `王座厅比${W("鲸鱼娘")}想象中安静。整座厅没有墙，四周是天光，中央那把云纹空王座浮在光里，扶手旁垂着那条银链——而王座正下方，一道竖直的光柱贯穿云层，光柱尽头，隐约是一片深蓝。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（在几步外站住，没有上前）那道光……通向哪里？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（不知何时已经盘在王座侧面，尾巴搭在扶手上，声音懒懒的）海。云上最深的深渊，云下最远的海——这道光，是整座城唯一一条往下走的路。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（盯着那片蓝，忽然移不开眼）往下……就是海。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（顺着她的目光看了一眼，难得没打趣）嗯哼。整座城，就数那条路最没人走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你叫我来王座厅，是为什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（从王座上跳下来，落在她面前，手里托着一小块云珀——淡蓝透白，里面像封着一片雾）接着。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}伸手去接——云珀没有落进她手里。它在半空停了一瞬，忽然亮起，顺着那道光柱缓缓飘起来，又缓缓落下，稳稳地落回${W("鲸鱼娘")}掌心。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（怔怔地看着掌心的云珀）它……自己飞过来的？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（盯着这一幕，好久才开口，声音有点哑）云珀认人。它在这个厅里挂了上千年，今天才第一次自己动。——王座，认你。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（捏紧云珀）这是……钥匙？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `月桥的钥匙，你走上云阶那天，就已经拿到了。图书馆那本借阅证，算第二把。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（看着她掌心）加上我手里这片云珀——三把凑齐了，海底那道门，才认你进门。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）……门？海底下，有一扇门？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没有直接回答，尾巴尖轻轻敲了敲光柱）有。比云上这座城都老的门。门的后面，坐着一个替你守了千年的位置。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头看那道光）那我……现在就下去？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（这次沉默了一会儿，才开口，语气里那点戏谑都收干净了）亚特兰蒂斯，从不认别人的王。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一顿）亚特兰蒂斯……是海底那座城的名字？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（点头）你记住这句话——别把这趟当离家。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（一字一句）要当，回。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `那三个字落进耳里，${W("鲸鱼娘")}握着云珀的手，轻轻收紧。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默了一阵）你守着这座城，也守了千年……你就没想过，那个位置，本来就是给别人的吗。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（笑了一下，很轻）我说过，王座空着，不代表没人守着。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（顿了顿）我说我是守座位的——从来没说，我是守给谁的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}怔住。云又静了一瞬，很久很久，谁都没有说话。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（忽然开口，恢复了一点懒散的调子）喂。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头）嗯？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（别过脸去，声音平淡，话却一点也不平淡）等你真坐上海底那把椅子……帮我看看，那个摄政王。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `摄政王？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `替我那位不在了的主人守海的家伙。这么多年，我一直想亲自问她一句——还稳不稳得住这片海。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（尾巴尖指了指光柱）你下去，替我问。问完，再替她回个话给我。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默地看了她半晌，把云珀妥帖地收进口袋）……我会的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那……我现在就走吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（盘回王座侧面，闭上眼睛，像在送客，又像在告别）去吧。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `云留不住海。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}最后看了一眼那把空王座——扶手旁的银链，在光里轻轻晃了一下。她没再回头，向光柱走去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音从身后追来，很轻，却清清楚楚）下次再来——就不是讨座了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `是带王来，认座。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}踏入光柱。云海在她脚下散开，深蓝的海面，一点一点漫上来。身后，云上那座城正安静地浮在天上——像等了很多年，终于送走了一个该回家的人。`,
            };
        },
        async () => {
            // 收尾：置 s2-3 played → 场景二完结（探索按钮消失；场景三待实现）
            await markSegmentPlayed("s2-3");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s2-3" 预载
        },
    },
);