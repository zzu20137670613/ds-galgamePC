import { whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 番外篇《岁月静好》（独立体系，非九段主线）。
 * 触发：锁死触发词「岁月静好」（见 lib/archive/extra-stories.ts），可反复触发、无进度状态机。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 *
 * 画面锚点：cg-syjh-1 ~ 11（十一张连续 CG，与源图生成顺序一致）。
 * 视角：**第二人称「你」陪着她**（区别于《一夜鱼龙舞》的"看两个角色"）——
 *   这篇只有她一个人，静好的前提是有人一起静。
 * 基调：纯日常·陪伴流，更甜。没有冲突、没有反转、没有糖点高潮，
 *   只是陪她过完这安稳的一天；收尾落在「今天什么都没发生——所以才这么好」。
 * 分幕：出门 → 樱径 → 教室 → 花园 → 取书 → 翻页 → 绣球 → 新书 → 回头 → 案头 → 仰望。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const extraSuiyuejinghaoLabel = newLabel(
    "extra-suiyuejinghao",
    [
        // ── 幕一 · 出门（校门外挥手）──
        async () => {
            await showCanvasBackground("cg-syjh-1", "cg-syjh-1");
            narration.dialogue = {
                text: `教学楼前的樱花落得正好。她站在台阶上，书包甩在肩上，隔着满天花瓣朝你挥手。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把手挥得更高了些）这里——你怎么走得那么慢。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（下巴一抬）快点。今天第一节是自习，老师不点名的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（声音忽然低下去）……我等你很久了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `那天没有考试，没有要回的消息，没有任何人在等你们。——只有一整个白天，安静的、归你们的。`,
            };
        },
        // ── 幕二 · 樱径（抱着书走在树下）──
        async () => {
            await showCanvasBackground("cg-syjh-2", "cg-syjh-2");
            narration.dialogue = {
                text: `上学的路被花瓣铺了厚厚一层。她抱着两本书走在前面，忽然停下，故意往最厚的地方踩。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（侧过脸）你听。——踩着会响。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她回头看你，裙摆上落了三四片花，她没拍掉。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把手背在身后）别拍。……好看。`,
            };
        },
        // ── 幕三 · 教室（窗边看书）──
        async () => {
            await showCanvasBackground("cg-syjh-3", "cg-syjh-3");
            narration.dialogue = {
                text: `靠窗的位置是她的。阳光从樱花树里漏下来，一格一格地爬过桌面。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（翻过一页）这一段我读了三遍。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（忽然抬头）你要不要坐过来一点？……那边有风。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她把书往中间推了推，空出半个桌面给你。`,
            };
        },
        // ── 幕四 · 花园（午休趴进花丛）──
        async () => {
            await showCanvasBackground("cg-syjh-4", "cg-syjh-4");
            narration.dialogue = {
                text: `午休的时候她整个人趴进了花丛，只露出白衬衫的一角。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（朝你招手，声音压得很轻）过来看。这个花——会合起来睡觉。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `所以别大声说话。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `你们在花丛里蹲了整整一个午休，什么也没干成。`,
            };
        },
        // ── 幕五 · 取书（图书馆踮脚够书）──
        async () => {
            await showCanvasBackground("cg-syjh-5", "cg-syjh-5");
            narration.dialogue = {
                text: `图书馆最上头那一层，她踮着脚，尾巴尖一翘一翘。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（很小声）……就差一点。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `你替她把书取下来。她接过去，耳尖有点红。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把书抱在怀里）我本来就够得到。（停了一下）……谢谢你。`,
            };
        },
        // ── 幕六 · 翻页（图书馆窗下共读）──
        async () => {
            await showCanvasBackground("cg-syjh-6", "cg-syjh-6");
            narration.dialogue = {
                text: `之后你们隔着一张小桌各自看书。安静到能听见彼此翻页的声音。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（没抬头）这一页真好。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（还是没抬头）——你翻得比我快。慢一点。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `那一刻阳光在书页上待了很久，谁也没舍得翻过去。`,
            };
        },
        // ── 幕七 · 绣球（庭院捧花）──
        async () => {
            await showCanvasBackground("cg-syjh-7", "cg-syjh-7");
            narration.dialogue = {
                text: `后院那丛绣球开爆了。她蹲下来，捧起一朵举到你面前。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你看——同一株上，颜色都不一样。蓝的、紫的、还有一点点粉。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（歪着头）你说它自己知道吗？`,
            };
        },
        () => {
            narration.dialogue = {
                text: `你答不上来。她也并不等答案，只是那样捧着，舍不得松手。`,
            };
        },
        // ── 幕八 · 新书（书展展台）──
        async () => {
            await showCanvasBackground("cg-syjh-8", "cg-syjh-8");
            narration.dialogue = {
                text: `路过书展的时候她走不动了，趴在新书展台上翻得入神，店员看了她两眼。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（很小声）我只翻前两页。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她翻了整整十七页。最后你把那本买了下来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把书抱得更紧）……那本是我自己要的。`,
            };
        },
        // ── 幕九 · 回头（书架旁的笑）──
        async () => {
            await showCanvasBackground("cg-syjh-9", "cg-syjh-9");
            narration.dialogue = {
                text: `书架与书架之间，你叫了她一声。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她抱着书回过头，笑了一下。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `——这一格不需要台词。`,
            };
        },
        // ── 幕十 · 案头（傍晚书桌前）──
        async () => {
            await showCanvasBackground("cg-syjh-10", "cg-syjh-10");
            narration.dialogue = {
                text: `天色暗下来的时候，她还在书桌前画画。眼镜摘下来，搁在一边。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（没抬头）再一会儿就好。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她画的是一片海。蓝色的，浪很小。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（笔尖顿了一下，声音很小）……里面有两条鱼。一条是我。`,
            };
        },
        // ── 幕十一 · 仰望（花架下收尾）──
        async () => {
            await showCanvasBackground("cg-syjh-11", "cg-syjh-11");
            narration.dialogue = {
                text: `傍晚你们走到花架下面。她抱着书抬头，一片橙色的花落下来，正落在书页上。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（看着那页花，没去拂）今天什么都没发生。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `「嗯。」`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（笑了一下）——所以才这么好。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}把书合上。这一页日子翻过去了，跟上一页一样，跟下一页也一样。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `岁月静好。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "extra-suiyuejinghao" 预载（11 张连续 CG）
        },
    },
);
