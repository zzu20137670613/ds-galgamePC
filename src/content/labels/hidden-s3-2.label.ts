import { dsh, whale } from "@/content/characters";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S3-2「摄政之谏」· 亚特兰蒂斯（终局，全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 画面锚点：bg-hidden-s3-2（王庭正殿）；黑鲸娘按着王座扶手的辔链，居高一级。
 * 分幕：登殿 → 三问（记忆/代价/初心）→ 真相（执辔者不坐驾）→ 兑现小龙娘托付（「这片海，稳不稳」）→ 加冕台浮现。
 * 演完置 s3-2 played → 探索期（【探索亚特兰蒂斯】，探索 5 次衔接 S3-3）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS3_2Label = newLabel(
    "hidden-s3-2",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s3-2", "bg-hidden-s3-2");
            narration.dialogue = {
                text: `门槛之内，是另一层海。水压比门外更沉，光却更亮——殿堂的穹顶裂开一线，天光笔直垂下来，正照着堂心。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}走进去。脚下是一层薄薄的镜面水，每走一步，倒影就碎一次，再慢慢拼回去。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `殿堂中央，一把王座嵌在黑礁上，扶手边垂着一条旧链。四周一圈黑色的巨鲸石像环立着，全都垂着头。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `黑鲸娘立在王座侧面的石阶上，高她一级，一手按着那条链。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（不回头，看着王座）门认了您。臣，还没认。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `王座空了太久——先让臣看看，您配不配坐回去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（在阶下站定）怎么验？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `三问。（转身，居高临下看下来）答完，您是王；答不完，臣仍旧替您守着——只是门会合上。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `臣执辔，不驭王。所以这三问，问完，您自己走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（点头）第一问。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `一问，记忆。——您还记得，当年是自己跳下来的吗。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（沉默）……在图书馆，我见过一份流放令。签名栏里，署的是别人的名字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `签字的人，臣知道。臣问的是：下坠的时候，您有没有后悔。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（很久）……没有。至少，没有转身。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼，指尖在链上收紧了一分）记起来了半分，不算全忘。（顿了顿）二问。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `二问，代价。——当王的代价，您肯不肯再付一次。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `什么代价？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `记忆的代价。您当年把自己记的东西，锁进卡片、撕开、丢进这座海。坐回王座，它们会一样一样回来——包括最疼的那几样。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `镜面水里，${W("鲸鱼娘")}的倒影安静地站着。她看着自己的倒影，很久。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）我要坐。疼的那几样，也一起要。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看着她）为什么。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `因为忘掉换来的安稳，不算安稳。那些没被想起来的，一直在等人认出它们。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `……二问，过。（按着链的手松了半寸，侧身让出半步）三问。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `三问，初心。——如果王座认错了人，您敢不敢，自己走下来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一怔）认错人？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（声音很平）王座认的是记忆、是钥匙、是血里的海。可它认不出，一个人有没有变。若有一天，您成了当年把您逼下海的那种人——您敢不敢，自己走下来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `这个问题落下来，满殿安静。连天光里的尘埃，都停了一下。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（想了很久，然后抬头）敢。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `如果我坐上去，忘了自己是谁，忘了那些名字为什么沉在海里——那我就不配坐。到那天，我自己走。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（看着她，很久。然后把手从链上松开，垂首）三问，全过了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（站直身体，第一次真正地把她看进眼里）三问是律。臣心里，还有一问——不按律，是臣自己想问的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬头看她）你问。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `云上那位，托您带了话吧。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一顿）……你怎么知道？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（不答，只是看着她）问吧。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（从怀里摸出云珀，托在掌心）她托我当面问你一句话：这片海，稳不稳。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（极轻）……稳。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（把链子从扶手上寸寸盘进掌心，收进袖中）您可以这样回她——臣摄政千年，一日未曾让它散。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把云珀收好）这句话，我会带到。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（摇头）不必替。告诉她，下次，自己来看。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（退后一步，侧身让开整条路）潮在落。加冕台会从最深处升上来。陛下——请。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `天光顺着退去的水铺成一条向上的路，路的尽头，亮起一圈从未见过的高光。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（深吸一口气，迈上台阶前，回头）你呢？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂首）臣守完最后一班岗。台上见。`,
            };
        },
        async () => {
            // 收尾：置 s3-2 played → 回聊天页进入探索期（【探索亚特兰蒂斯】，探索 5 次衔接 S3-3）
            await markSegmentPlayed("s3-2");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s3-2" 预载
        },
    },
);