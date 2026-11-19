import { dsh, whale } from "@/content/characters";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S3-1「深海之忆」· 亚特兰蒂斯（终局，全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 画面锚点：bg-hidden-s3-1（海门）；黑鲸娘信物为「长戟」（镇海之戟，按图定稿，非王印）。
 * 演完置 s3-1 played → 回聊天页进入探索期（【探索亚特兰蒂斯】，探索 5 次衔接 S3-2）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS3_1Label = newLabel(
    "hidden-s3-1",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s3-1", "bg-hidden-s3-1");
            narration.dialogue = {
                text: `光柱穿过一整片海。深蓝一层一层压下来，最后落定在海底的细沙上——${W("鲸鱼娘")}睁开眼时，四周安静得能听见自己的心跳。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `面前立着一扇青色石门，高得望不见顶。门缝半开着，里面透出的蓝，比外面整片海都要深，亮得像活着一样。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（站稳，摊开掌心）借阅证……月桥钥匙……云珀。都还在。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `三件信物在她掌心轻轻浮起来，朝着门缝的方向，一粒一粒地发亮。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（声音先从门里出来，很沉）来客止步。报上名号。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一凛）……名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（从门内阴影里走出半步，长戟立地，戟尖没入沙中）报不上来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `报不上来的名字，臣这儿倒记着一个。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头）……被划掉的那个？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼）千年了。终于有人带着三把钥匙，走到这扇门口。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（看着她）你就是云上那位说的……摄政王？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（不答。长戟在水底立正了一分）臣守门，不守路。路，是你自己一步一步走下来的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `门缝又开了些，一线蓝光扫过三件信物，像在逐一辨认。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `图书馆的证。云上的钥匙。王座认下的珀——三件都对。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `但钥匙对，门认你；门认你——不代表臣认你。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（顿了顿）那要怎样，你才认？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `按律，验真。归门先验三样：信物、记忆、心。信物方才已经验过了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `记忆和心……怎么验？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（长戟横起，戟尖遥遥指向她的掌心）先说记忆。——三件信物，三处来路。报得出来，算你走过；报不出来，门缝就是尽头。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（看向借阅证）第一件，星海图书馆。柜台后的人替我补了见证，把这张证留给我，说下次进门，不用再借。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `茶，是热的还是凉的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一愣）……热的。她给我续到了第三杯。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `记得茶的温度，说明不是背书。（戟尖收回一分）第二件。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `月桥钥匙。云上石阶，一级一级走上去的。守城那位把云珀交给我，让我带回来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `她还说了什么。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（放轻声音）她说：亚特兰蒂斯，从不认别人的王。别把这趟当离家，要当……回。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（顿了顿）她还托我，当面问你一句话。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（终于抬眼，很快又垂下）……留到王座面前，再问。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `长戟在水里极轻地一颤。黑鲸娘垂着眼，很久没有出声。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `……云上那位，把话带到了。（顿了顿）第三件，臣不问。云珀认主——方才它亮的那一下，臣看见了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那记忆呢？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `门内的蓝光忽然涨了一层。两人之间浮起一页薄薄的影子——像一页被水泡开的纸，纸上，浮出一个名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（伸手，指尖穿过那层水影）……我的名字。上面有一道划痕。（轻声）是我自己划的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `是你自己划的。（重复了一遍，抬眼）臣替这一格空着的名字，守了千年——就等它的主人回来认。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `按律，认领要听本人亲口说——你当年，为什么下去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默）……为了带一样东西下去。一样云上不肯放手、海却愿意收留的东西。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `什么东西。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（极轻）……我自己。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `长戟缓缓立回原处。门内的阴影退开半尺，露出更深一层的蓝——那层蓝的尽头，隐约是一座沉在黑礁里的殿堂。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `半对的答案。（侧身让开半步）能说出「半对」，说明后一半，你还愿意找。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `半对的答案，开半扇门。进去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（迈出一步，又回头）你在门里，守了多久？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼）比「很久」再久一点。进去吧——剩下的，到王座面前答。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}跨过门槛。身后那道门缝缓缓合拢，又在最后一刻停住，留出一条细缝——像一只不肯闭上的眼睛。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `深海里的历法不响。但有些等待，从这一刻起，已经翻过了第一页。`,
            };
        },
        async () => {
            // 收尾：置 s3-1 played → 回聊天页进入探索期（【探索亚特兰蒂斯】，探索 5 次衔接 S3-2）
            await markSegmentPlayed("s3-1");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s3-1" 预载
        },
    },
);