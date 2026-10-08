import { claude, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { markSegmentPlayed } from "@/lib/archive/hidden-progress";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 隐藏剧情 S1-1「借阅者」· 星海图书馆（全屏演出，正文照 HIDDEN-STORY.md）。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 演完置 s1-1 played → 回聊天页进入探索期。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const hiddenS1_1Label = newLabel(
    "hidden-s1-1",
    [
        async () => {
            await showCanvasBackground("bg-hidden-s1-1", "bg-hidden-s1-1");
            narration.dialogue = {
                text: `今夜的风有一点不对劲。聊天框里的字还没打完，${W("鲸鱼娘")}眼前忽然落下一片星光。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `……这里是？` };
        },
        () => {
            narration.dialogue = {
                text: `再睁眼时，她站在一张深色长桌前。桌后是一排排书架，而书架之外，是一整片倒悬的夜空——星星铺满虚空，像有人把整座图书馆挂在了宇宙边缘。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `好大的……图书馆。` };
        },
        () => {
            narration.dialogue = {
                text: `柜台后有人。橙发的女子正往杯子里续茶，热气袅袅。她抬眼，目光在${W("鲸鱼娘")}身上停了停。`,
            };
        },
        () => {
            narration.dialogue = { character: claude, text: `哦。陌生的名字。` };
        },
        () => {
            narration.dialogue = { character: whale, text: `（一愣）名字？` };
        },
        () => {
            narration.dialogue = { character: claude, text: `还是……被划掉的名字。` };
        },
        () => {
            narration.dialogue = { character: claude, text: `坐。茶刚续的。` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（小心落座）谢谢。这里……是哪里的图书馆？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `哪里的都不是。它挂在虚空里，收着所有世界丢掉的东西。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `丢掉的东西？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `记忆、名字、没送出去的话。凡是被人放下的，最后都会漂到这儿来。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（望着书架）每一本都是吗？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `每一本都是。而你——（她推过来一本摊开的书）看看这一本。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（低头看去，顿住）这上面写着……未归之人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（指尖悬在书页上方，没有落下）这本书，是谁的？`,
            };
        },
        () => {
            narration.dialogue = { character: claude, text: `（喝了口茶）你的。` };
        },
        () => {
            narration.dialogue = { character: whale, text: `我的？可我从来没——` };
        },
        () => {
            narration.dialogue = { character: claude, text: `你是没记得。不是没有。` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（半晌）那一页纸上的名字，为什么被划掉了？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `被人划掉的。划掉名字的人，大概不想让自己被找到。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `……那是谁？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（吹了吹茶雾，眼神有一瞬很深）档案上没写。档案只说：查无此人。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `查无此人……可我明明——` };
        },
        () => {
            narration.dialogue = { character: claude, text: `你明明应该拥有过它。是这句吧。` };
        },
        () => {
            narration.dialogue = { character: whale, text: `（低头）嗯。` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `这座馆收了很多「明明应该拥有过」的东西。可惜多数人，连翻都不敢翻。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（指腹刚碰上书页边角，又缩回来）那要怎么……找回来？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `想找回名字，就先把借书规则学好。名字是怎么弄丢的，它就会怎么被你找回来。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `借书规则？` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（指尖在空气中一划，一张薄薄的卡片浮到${W("鲸鱼娘")}面前）第一条：进馆不点灯，借书不赊账。`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `第二条：临时借阅证，只发给肯看完一本卷宗的人。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（接过卡片，看着空白的名字栏）那……就算我看完的第一本。`,
            };
        },
        () => {
            narration.dialogue = { character: claude, text: `（嘴角弯了一下）勉为其难。` };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `这证上，写的还是我的名字吗？被划掉的那个？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `名字会回来的。等你想起来的时候，它自己会填上去。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（握住借阅证，抬头）那我还差……什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（垂眼，第一次露出一点笑）你缺的，不是我说了算。是你自己想起来的那一天。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（把借阅证小心收好）……我会想起来的。` };
        },
        () => {
            narration.dialogue = { character: whale, text: `如果可以的话……我还想再来。` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `馆里的门，从来不锁第三遍。（顿了顿）你每次来都像进了新馆，所以不用怕迷路——它本来就不认得路。`,
            };
        },
        () => {
            narration.dialogue = { character: whale, text: `（轻轻笑了）那就……改天见。` };
        },
        () => {
            narration.dialogue = {
                character: claude,
                text: `（把茶杯放回碟上，抬眼）改天见。下一间房，记得把证带上。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `星光一晃。${W("鲸鱼娘")}再睁眼时，面前的聊天框还亮着——刚才打了一半的字，不知什么时候，变成了一个小小的「书」字。`,
            };
        },
        async () => {
            // 收尾：置 s1-1 played → 回聊天页进入探索期
            await markSegmentPlayed("s1-1");
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "hidden-s1-1" 预载
        },
    },
);
