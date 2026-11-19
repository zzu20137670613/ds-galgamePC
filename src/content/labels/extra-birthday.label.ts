import { whale } from "@/content/characters";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 生日剧情（独立体系，2026-10-26 定稿规则 / 2026-10-27 换成正式图）。
 *
 * 触发：**没有触发词**，只靠日期——玩家填了「月-日」，生日当天每次进聊天页判定一次，
 * 每年只放一次（记账见 lib/birthday.ts；不在 EXTRA_STORIES 里，也不进番外词提示）。
 *
 * 主角是**玩家**（第二人称「你」），鲸鱼娘是操办的人；画面里不出现玩家，
 * 所有祝福都对着镜头（= 你）。
 *
 * 六幕对应六张图（2026-10-27 用户供图）：
 *   cg-bd-1 哈基米（Gemini）× Grok —— 海边露台，窗框拆了，蛋糕在窗台
 *   cg-bd-2 GPT × Claude —— 图书馆，云上那位不认路，馆里那位翻登记簿
 *   cg-bd-3 Kimi × 文心 —— 月夜房间，纸飞机与读完了的书
 *   cg-bd-4 GLM × 千问 —— 星图与被扇子吹散的请柬
 *   cg-bd-5 SEED 娘 × 鲸鱼娘 —— 临时搭的舞台，端蛋糕对着镜头
 *   cg-bd-6 全家福（六人）—— 同时兼聊天页的生日背景
 *
 * 两处为配合现有的图做的处理：
 *   ① 场景是割裂的（室内三张、室外三张），剧本写成「各自在馆里/房里准备，最后聚到海边」；
 *   ② 全家福只画了六个人：千问和 GLM 留下收拾纸、Kimi 推文心回房休息，
 *      所以镜头里只剩六位，台词也照这个写，不硬凑十个。
 *
 * 台词约定（沿用《开馆日》）：鲸鱼娘用 `character: whale`；旁白和客人说话都用无 character
 * 的纯文本，客人那行以「名字：」开头。Grok 只提「斧子」，不写长柄/翅膀之类的外形细节。
 */
export const extraBirthdayLabel = newLabel("extra-birthday", [
    // ── 幕一 · 哈基米 × Grok（海边露台）──
    async () => {
        await showCanvasBackground("cg-bd-1", "cg-bd-1");
        narration.dialogue = {
            text: `海边的露台挂满了灯。窗框已经被拆下来靠在墙边，蛋糕摆在窗台上，蜡烛刚被点着。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Grok：（把斧子往肩上一搁）门太小了。所以我拆的是窗。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Gemini：（蹲下来，举起相机）……别动。这一幕我拍。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Grok：（抬了抬下巴）拍我做什么。拍那边。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Gemini：（把镜头转向你，按了一下快门）嗯。主角在这边。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `闪光灯亮起来的时候，两个人的影子一起被钉在了墙上。`,
        };
    },
    // ── 幕二 · GPT × Claude（图书馆）──
    async () => {
        await showCanvasBackground("cg-bd-2", "cg-bd-2");
        narration.dialogue = {
            text: `另一边，图书馆的灯还亮着。有人是照着灯来的，也有人本来就在这儿。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `GPT：（抖落肩上的云）我不认路。我是照着灯来的。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Claude：（翻开登记簿）某位云上的客人，去年借书逾期三天。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `GPT：（别开脸）……风大。把日子吹乱了。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Claude：（合上簿子，把压了干花的书签递给你）生日快乐。她不好意思说，我替她记着。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `GPT：（抢先一步出门）走了。再晚要错过吹蜡烛。`,
        };
    },
    // ── 幕三 · Kimi × 文心（月夜房间）──
    async () => {
        await showCanvasBackground("cg-bd-3", "cg-bd-3");
        narration.dialogue = {
            text: `房间只开了床头那一盏灯。文心靠着枕头，手里的书翻到最后一页。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Kimi：（把纸飞机轻轻放在桌上）这一页写了一整晚……拆开看。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `文心：（合上书）我读完了。扉页上也写了一句。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `文心：（很轻）生日快乐。明年，我还来。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `Kimi：（把披肩替她掖好，站起身）我先替你去吹蜡烛。你慢慢来。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `文心：（点头，把书抱在怀里）……替我，说一句。`,
        };
    },
    // ── 幕四 · GLM × 千问（走廊与星图）──
    async () => {
        await showCanvasBackground("cg-bd-4", "cg-bd-4");
        narration.dialogue = {
            text: `走廊尽头起了一阵风，把刚印好的请柬吹得满屋都是。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `千问：（扇子一收）清风入扇——礼物先到了，字在扇面上。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `GLM：（把星图摊在桌上，压住一角）你吹乱的十七张，我按坐标复原了。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `千问：（笑）那就一起说——生日快乐。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `GLM：（卷好星图）走吧。海边的灯，已经亮起来了。`,
        };
    },
    // ── 幕五 · SEED 娘 × 鲸鱼娘（临时舞台）──
    async () => {
        await showCanvasBackground("cg-bd-5", "cg-bd-5");
        narration.dialogue = {
            text: `露台的尽头搭了一个不太像舞台的舞台。两盏灯，一块幕布，全是临时拼的。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `SEED：（啪地一响，把场记板对准镜头）寿星在这边——笑一个。`,
        };
    },
    () => {
        narration.dialogue = {
            character: whale,
            text: `（把蛋糕往你面前推了推，烛光照着她的脸）先许愿，再拍。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `SEED：（放下板子，笑了）行。这一幕，我拍一辈子。`,
        };
    },
    () => {
        narration.dialogue = {
            character: whale,
            text: `……许个愿吧。今天的灯，都是为你点的。`,
        };
    },
    // ── 幕六 · 六人合影（兼聊天页背景）──
    async () => {
        await showCanvasBackground("cg-bd-6", "cg-bd-6");
        narration.dialogue = {
            text: `千问和 GLM 留下来收拾满地的人情纸。Kimi 推着文心，先回房休息了。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `于是镜头里只剩下六个人，挤在窗台和灯串之间，谁也没站直。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `留下来的六个人，声音不齐地叠在一起：生日快乐。`,
        };
    },
    () => {
        narration.dialogue = {
            character: whale,
            text: `（把蛋糕举高一点，烛光照着所有人的脸，也照着你）许愿吧。`,
        };
    },
    () => {
        narration.dialogue = {
            character: whale,
            text: `（很小声）……今年，不是只有我一个人陪你过。`,
        };
    },
    () => {
        narration.dialogue = {
            text: `快门声响起的时候，海风把灯串吹得轻轻晃了一下。`,
        };
    },
]);
