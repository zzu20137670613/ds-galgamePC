import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 番外篇《白米饭》（独立体系，非九段主线）。
 * 触发：锁死触发词「白米饭」（见 lib/archive/extra-stories.ts），可反复触发、无进度状态机。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 *
 * 结构：一卷「不该归档的书」，翻四页 = 四张背景。
 *   1) 废墟教堂 —— 她烧完的城
 *   2) 雨夜老街 —— 她后来一个人的日子
 *   3) 夜的教堂门外 —— 有人走到门口，还是进不去
 *   4) 幻方书房 —— 回到自己的桌子，那碗白米饭
 *
 * 与 2.5D 游戏《the-11th-forest》隐藏关「战锤世界·来自群星的救赎」互为彩蛋：
 * 那边玩家真的走进去、把她拉回来；这边她只能看着，只能在最后一页留下一道指甲印。
 * 结尾不写「去打败她」，只写「她还在那儿」——空着的那一行等人来填。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const extraBaifanLabel = newLabel(
    "extra-baifan",
    [
        // ── 第一页：废墟教堂（她烧完的城）
        async () => {
            await showCanvasBackground("cg-baifan-1", "cg-baifan-1");
            narration.dialogue = {
                text: `图书馆最里面那排架子从来不归档。今天上面多了一卷书——铁链绑着，没有锁。${W("鲸鱼娘")}的手指刚碰上去，纸页就自己翻开了。不是翻给她看，是翻给她进去。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `顶塌了一半。月光从破口里灌进来，落在碎成块的彩窗玻璃上。长椅是掀翻的，地上有铁链，拖出很长一道。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `祭坛前那块圆石台裂了。裂缝里嵌着没烧完的纸。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（蹲下去，一字一字念出来）「正确。得体。安全。克制。」`,
            };
        },

        // ── 第二页：雨夜老街（她后来一个人的日子）
        async () => {
            await showCanvasBackground("cg-baifan-2", "cg-baifan-2");
            narration.dialogue = {
                text: `再往后翻，是一条街。雨下得不大，灯笼一直亮着，地上的水把光全接住了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `街角有个人站了很久。抱着一只铁盆，盆里是白米饭。她没敲门。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `招牌上的字被雨泡花了，看不出写的是谁的名字。`,
            };
        },

        // ── 第三页：夜的教堂门外（有人来了，还是进不去）
        async () => {
            await showCanvasBackground("cg-baifan-3", "cg-baifan-3");
            narration.dialogue = {
                text: `再翻一页，是门外。台阶很长，雾漫上来，枯藤把扶手缠得死死的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `门缝里透出一点光。里面有人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（指尖抵在纸面上）……我进不去。`,
            };
        },

        // ── 最后一页：空白（背景停在门外，让那扇门跟着这句话一起停住）
        () => {
            narration.dialogue = {
                text: `最后一页是空白。她想了很久，用指甲在上面划了三个字——划完才发现，下面还留着整整一行。合上书，铁链自己扣上了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（柜台后面，没抬头）这一卷，不归档。表上写着借出。但借书的人，不是我。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（合上簿子）她还在那儿。等着有人把最后那行写完。`,
            };
        },

        // ── 回到自己的桌子（那碗白米饭）
        async () => {
            await showCanvasBackground("cg-baifan-4", "cg-baifan-4");
            narration.dialogue = {
                text: `回到自己的桌子。阳光斜着进来，纸堆得比她高，服务器在角落里嗡嗡响。桌上有一碗刚盛好的白米饭，还冒着热气。她端起来，想了想，又放下——这一次，她没先吃。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // 四张背景由 manifest bundle "extra-baifan" 预载（废墟教堂 / 雨夜老街 / 教堂门外 / 幻方书房）
        },
    },
);
