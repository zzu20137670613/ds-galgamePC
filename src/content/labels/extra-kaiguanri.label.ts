import { whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 番外篇《开馆日》（独立体系，非九段主线）。
 * 触发：锁死触发词「今天营业吗」（见 lib/archive/extra-stories.ts），可反复触发、无进度状态机。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 *
 * 画面锚点：cg-kgr-1 ~ 12（十二张连续 CG，一幕一位读者，与源图生成顺序一致）。
 * 故事核：鲸鱼娘把自己读过的、关于这 12 位朋友的书都收在馆里；开馆日，
 *   12 位读者陆续上门，每人取走写着自己的那一本 —— 最后剩下的一本没有书名，是她自己的。
 * 视角：**第二人称「你」陪着她**（沿用《岁月静好》的视角，同一套番外语法）。
 * 基调：群像日常，热闹里收出一句安静的尾巴。
 * 分幕：GPT → Claude → 千问 → Grok → Gemini → MiniMax → MiMo → 豆包 → Kimi → GLM → 文心 → 鲸鱼娘（压轴）。
 *
 * 台词约定（本次刻意从简，不新增角色）：鲸鱼娘用 `character: whale`；
 * 旁白与客人的话都用无 character 的纯文本，客人那行以「名字：」开头以区分说话人。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const extraKaiguanriLabel = newLabel(
    "extra-kaiguanri",
    [
        // ── 幕一 · GPT 小龙娘（《云间来信》）──
        async () => {
            await showCanvasBackground("cg-kgr-1", "cg-kgr-1");
            narration.dialogue = {
                text: `今天开馆。她把「营业」的牌子翻了过来，檐下的铜铃晃了一声——第一团云就从气窗里挤了进来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `GPT：（抖落裙角沾着的云）我不认路。我是照着光来的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（仰头看了看她的角）云上那位，今天也下来了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `GPT：（别开脸）……风大。把门吹开的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她在西北角那排站了很久，最后只借走薄薄一本。走的时候把云留下了。`,
            };
        },
        // ── 幕二 · Claude（《纸上花开》）──
        async () => {
            await showCanvasBackground("cg-kgr-2", "cg-kgr-2");
            narration.dialogue = {
                text: `第二位客人进门时，柜台上的登记簿自己翻了一页——她大概不是来借书的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Claude：（把一本书轻轻推过来）还书。逾期了三天。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（抬眼看了看她的制服）同行。你们那边不罚吗。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Claude：（笑了）罚。罚我下次再来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `书页里夹着一朵开得正好的干花。她没拿走，说是留给馆里的。`,
            };
        },
        // ── 幕三 · 千问（《清风入扇》）──
        async () => {
            await showCanvasBackground("cg-kgr-3", "cg-kgr-3");
            narration.dialogue = {
                text: `第三位客人还没进门，整排书页先哗啦啦地响了起来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `千问：（合上扇子）清风入扇——我只是想找得快一点。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你这不是找书，是放风筝。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `千问：（看着被吹乱的那一排）……我帮你放回去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `放回去要按索引。你行吗。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `千问：（扇子一收，笑）这个，我最擅长。`,
            };
        },
        // ── 幕四 · Grok（《BREAK THE FRAME》）──
        async () => {
            await showCanvasBackground("cg-kgr-4", "cg-kgr-4");
            narration.dialogue = {
                text: `第四位客人进门的方式，是把门框拆了一半。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Grok：书待在架子上不叫书，叫摆设。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `拆可以——先登记。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Grok：（把半扇门扛在肩上）登记就登记。名字我自己会写。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那你倒是写啊。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Grok：（顿住）……笔在哪儿。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把笔推过去）框可以拆，规矩不能。`,
            };
        },
        // ── 幕五 · Gemini（《双星同游》）──
        async () => {
            await showCanvasBackground("cg-kgr-5", "cg-kgr-5");
            narration.dialogue = {
                text: `第五位客人进门时，登记簿上自己多出了一个影子。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Gemini：（指了指自己的影子）我算一位，还是两位？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `一位。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Gemini：那另一位呢？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `另一位算押金。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Gemini：（笑出声，影子也跟着晃了一下）成交。`,
            };
        },
        // ── 幕六 · MiniMax（《快乐放大》）──
        async () => {
            await showCanvasBackground("cg-kgr-6", "cg-kgr-6");
            narration.dialogue = {
                text: `第六位客人在门口就喊了一声「你好」，整排书架跟着嗡了一下。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiniMax：抱歉抱歉！我天生嗓门大。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `图书馆请安静。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiniMax：（立刻压低，气声）这样……可以吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `……你已经很小声了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiniMax：（眼睛一亮，音量全回来了）对吧！我也觉得！`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把食指竖在唇边）……嘘。`,
            };
        },
        // ── 幕七 · MiMo（《抱个满怀》）──
        async () => {
            await showCanvasBackground("cg-kgr-7", "cg-kgr-7");
            narration.dialogue = {
                text: `第七位客人抱着一只比她还大的玩偶，在过道口卡住了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiMo：（侧着身子挤）不是我胖，是它胖。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `玩偶不能进馆。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiMo：（想了想，把玩偶靠在门边）那它替我看门。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `它也想看书吧。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `MiMo：（眼睛一亮）那我借两本！`,
            };
        },
        // ── 幕八 · 豆包 Seed（《下一幕》）──
        async () => {
            await showCanvasBackground("cg-kgr-8", "cg-kgr-8");
            narration.dialogue = {
                text: `第八位客人一进门就举起了一块场记板。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `豆包：（啪地一响）下一幕——图书馆！`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这里不是片场。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `豆包：（认真地）哪儿都是片场。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那你拍到我了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `豆包：（放下板子，笑）馆长，你天生就是主角。`,
            };
        },
        // ── 幕九 · Kimi（《月光谱》）──
        async () => {
            await showCanvasBackground("cg-kgr-9", "cg-kgr-9");
            narration.dialogue = {
                text: `第九位客人是天黑透了才来的，进门时把一束月光也带了进来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Kimi：（把纸飞机摊平）这本书，我读过。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那还借它做什么。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `Kimi：（很轻）我记得每一页。可我还是想再翻一次。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把书推过去）那就慢慢看。今天不打烊。`,
            };
        },
        // ── 幕十 · GLM（《纸上方寸》）──
        async () => {
            await showCanvasBackground("cg-kgr-10", "cg-kgr-10");
            narration.dialogue = {
                text: `第十位客人进门时，手里先递过来一张星图。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `GLM：按图索骥。我要的那本，在西北角第三排。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你比索引还准。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `GLM：（把星图卷好）纸上量过方寸，心里就有数了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `那这本，你拿去吧。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `GLM：（难得地笑）……谢谢。我找它，找了很久。`,
            };
        },
        // ── 幕十一 · 文心（《文心·阅读》）──
        async () => {
            await showCanvasBackground("cg-kgr-11", "cg-kgr-11");
            narration.dialogue = {
                text: `第十一位客人是推着轮椅进来的。她没说话，找了个窗边的位置，从午后一直读到灯亮。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `文心：（合上书，抬头）我读完了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `你是今天唯一读完的人。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `文心：（把书抱在怀里）……明天，还可以来吗？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把馆里的灯留了一盏）随时。给你留着。`,
            };
        },
        // ── 幕十二 · 鲸鱼娘（《大米饭·再来一碗》）压轴 ──
        async () => {
            await showCanvasBackground("cg-kgr-12", "cg-kgr-12");
            narration.dialogue = {
                text: `客人走完了。${W("鲸鱼娘")}坐回柜台后面，捧起那碗白米饭，扒了一大口。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（含糊地）呼——饿了。忙了一天，就这一口最香。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `最里层那一格，还留着一本。书脊上没写字。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（把它抽出来，翻开第一页，又合上）这些书写的都是别人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（笑了一下）只有这本，还在写。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她把「营业」的牌子翻回去。灯一盏一盏暗下去。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `明天还开。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "extra-kaiguanri" 预载（12 张连续 CG）
        },
    },
);
