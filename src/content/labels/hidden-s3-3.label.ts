import { dsh, whale } from "@/content/characters";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S3-3「加冕」· 亚特兰蒂斯（终局，全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 画面锚点：bg-hidden-s3-3（加冕台）；结尾全屏插入 bg-meme-dyj（小难梁「大赢鲸」登基凭证）。
 * 分幕：潮退台现 → 交还王冠与辔 → 单膝托冠加冕 → 大赢鲸彩蛋 → 九段归途全部走完。
 * 演完置 s3-3 played → 隐藏剧情终局完结（S3-3 为段链末段，不再进探索期）。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS3_3Label = newLabel(
    "hidden-s3-3",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s3-3", "bg-hidden-s3-3");
            narration.dialogue = {
                text: `潮水退开的时候，没有声音。整座殿堂的水面一层层下落，把一条石阶铺成的路，从最深的地方一路亮了出来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}一级一级走上去。台阶不凉，像被什么暖着——头顶海面透下天光，照得这条路上一个影子都没有。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（停下脚步）……加冕台。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `台上环立着黑色的巨鲸石像，齐齐低首。黑鲸娘站在台心等她——长戟不在手上，今日立在门外。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `三问已过。归门验真，到今日，全部结清。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `……然后呢？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `按律，臣交还两样东西。（抬眼）一样，是王冠。另一样，是辔。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一顿）辔？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `王座扶手上那条链，叫辔。臣摄政千年，执的就是它。执辔者不坐驾，只护驾。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻声）所以你守了千年，一次都没坐上去过。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `坐上去，海就是臣的了——那臣守的，就不是「等您回来」这件事了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她说得平静，像在念一条记了千年的律文。只有最后半句，尾音很轻。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这千年，辛苦你了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `不辛苦。臣说过的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `可我想听真话。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `……头一百年最难。海记得您，海里的一切都记得您；只有臣，得装作这儿从来没有过王。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（很久）……以后，不用再装了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼）……是。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `天光静静落着。${W("鲸鱼娘")}把云珀收回怀里——要问的话，在殿里已经问完了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（走向石座，抬手抚过座沿，像抚过一件终于能交出去的旧物；然后转身，站定）陛下。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `这两个字落下来，台上一圈鲸像，齐齐吐出一口气。水雾笼住了整座加冕台。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `请登位。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她退到最上一级，侧身让开。天光从她背后漫过来，把石座染成浅金色。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（走向石座，在座前停住，回头）还有一件事。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `陛下请讲。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `云上那位说过——亚特兰蒂斯从不认别人的王。所以今天这个位子，我想先问你：你认吗？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `满台安静。黑鲸娘站在光里，看着她，看了很久。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（抬手按在胸口，缓缓垂首）臣，摄政千年，今日交印。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（单膝跪下，双手托起一顶古老王冠，举到她面前）臣，认。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `王冠落在${W("鲸鱼娘")}手上，比想象中轻——像一片海，终于肯把自己放下来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（跪着，抬眼看她）从今往后，海是您的。辔头……也归您。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（扶起她）那这条辔，我们一起执。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `天光落了满台。石座两侧翻起细浪，一圈一圈，把加冕送向深海的每一个角落。`,
            };
        },
        async () => {
            // 彩蛋：登基凭证全屏插入（小难梁「大赢鲸」梗图）
            await showCanvasBackground("bg-meme-dyj", "bg-meme-dyj");
            narration.dialogue = {
                text: `就在这时，海面上方忽然亮起一格不属于海底的白光——像有人把一页东西，啪地夹进了卷宗里。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（抬眼，沉默了三秒）……这一页，不在律里。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `白光里，一个戴眼镜的西装身影跨进画面——有人认得，那是小难梁。他把一团圆滚滚的「大赢鲸」往前一递，郑重其事：登基凭证，收好。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dsh,
                text: `（垂眼）……收下吧，陛下。有些凭证，比王冠来得不容易。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（轻轻笑了）那就收下。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `白光收走。海在光里安静下来——九段归途，至此全部走完。`,
            };
        },
        async () => {
            // 终局收尾：置 s3-3 played → 隐藏剧情全通（末段无探索期，回聊天页）
            await markSegmentPlayed("s3-3");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s3-3" 预载（含大赢鲸梗图）
        },
    },
);