import { dragon, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 番外篇《一夜鱼龙舞》（独立体系，非九段主线）。
 * 触发：锁死触发词「鱼龙舞」（见 lib/archive/extra-stories.ts），可反复触发、无进度状态机。
 * 「鲸鱼娘」占位符 → 运行时替换为用户设定名（whaleName）。
 * 画面锚点：cg-ylyyw-1 ~ 8（八张连续 CG 逐张切换）；口味：甜辣递进·意象留白（不写露骨）。
 * 分幕：灯会棋亭（近）→ 系带（近）→ 烟花（对望）→ 进屋 → 尾巴缠上 → 张力拉满 → 十指相扣 → 余韵。
 */
const whaleName = () => SetupStore.store.state.whaleName || "鲸鲸";

/** 台词工具：把正文里的「鲸鱼娘」占位符替换成设定名 */
const W = (s: string) => s.replaceAll("鲸鱼娘", whaleName());

export const extraYulongwuLabel = newLabel(
    "extra-yulongwu",
    [
        async () => {
            await showCanvasBackground("cg-ylyyw-1", "cg-ylyyw-1");
            narration.dialogue = {
                text: `「一夜鱼龙舞」——不过是随口念的一句。念完，字还悬在唇边，风里忽然就有了灯。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `云上一年一度的灯会，只此一夜。${W("鲸鱼娘")}回过神时，人已经被拽上了一座棋亭——满城灯火在脚下铺开，对面那位托着腮，正等着她。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（指尖敲了敲棋盘）坐。三局两胜。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（坐下，看了一眼棋盒）……赌什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（把黑棋推过来，眼睛在灯影里发亮）输的人，今晚答应赢家一件事。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（摸起一颗棋子）怎么听着像陷阱。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（笑）你猜。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `第一局她落子很稳。第二局开始，对面那位换了个坐姿——`,
            };
        },
        () => {
            narration.dialogue = {
                text: `上半身越过棋盘探过来，指尖按在${W("鲸鱼娘")}的棋子上，鼻尖几乎要蹭到她的鼻尖。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（压着声音）这颗，你确定？`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（心跳乱了一拍，棋子「啪」地落在格子里）……确定。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（望着落错的位置，弯起眼睛）输了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `灯影转了一格。她没退回去，就那样近地看着${W("鲸鱼娘")}——近得能看清她睫毛上的一点灯光。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-2", "cg-ylyyw-2");
            narration.dialogue = {
                text: `第三局下到一半，她忽然站起来，伸手去够高处那盏走马灯。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（披帛从肩头滑下来）……唔。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `灯绳没够着，带子倒先散了。那截衣带垂在半空，晃晃悠悠。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（站起来，手已经伸过去）别动。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `指尖把带子拢回来，一圈，两圈，系紧。——距离就在那里：她的呼吸，落在${W("鲸鱼娘")}的手背上，很近，很轻。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（垂眼看着她的手，忽然开口）手抖什么。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（一顿）……灯太晃。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（轻轻笑了一下，没有戳穿）嗯。灯太晃。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-3", "cg-ylyyw-3");
            narration.dialogue = {
                text: `楼下的街忽然炸开一层亮。鱼龙灯出巡了——先是鱼，后是龙，一盏一盏从街这头游到那头。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `第一发烟花在云上炸开，光从她背后涌过来，把两个人的影子都照亮了。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（没有看烟花，看着她）鱼龙舞。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（愣住）……什么？`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（极轻，像说给自己听）没什么。看灯。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-4", "cg-ylyyw-4");
            narration.dialogue = {
                text: `灯会最热闹的时候，她拉起${W("鲸鱼娘")}的手腕：「太吵了。换个地方。」`,
            };
        },
        () => {
            narration.dialogue = {
                text: `廊道很长。她走在前头，尾巴梢一左一右轻轻摆着，鞋跟敲在地板上，一声，又一声。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（头也不回）跟丢了我可不管。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `门开的一瞬，烟花正好在窗外炸开第三轮。整间屋子，泡在灯的光里。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `屋里没有开灯。窗外的烟花一轮接一轮，把被子照成紫的，又照成金的。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（在床边坐下）这里的景，比棋亭还好。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（在她旁边坐下，尾巴随意垂在两人之间）还行。守城的人，总得给自己留个好位置。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `说完这句，屋里安静下来。只剩烟花在很远的地方开花。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-5", "cg-ylyyw-5");
            narration.dialogue = {
                text: `然后${W("鲸鱼娘")}发现——那条白龙的尾巴，不知什么时候挪了过来，尾尖轻轻搭上了她的鲸尾。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（僵住，没敢动）……`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（眼睛看着窗外，像什么都没发生）灯挺好看的。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `她说这话的时候，尾巴却又缠紧了一点。白鳞擦过蓝鳞，有一点凉，很快又暖起来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}的呼吸乱了半拍——她明明听见了：旁边那位，也一样。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（终于侧过头，声音压得很低）要不要，假装没发现。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（耳尖烧起来）……装不来。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-6", "cg-ylyyw-6");
            narration.dialogue = {
                text: `灯影在被子上一格一格地转。两条尾巴不知什么时候已经绕在了一起，尾尖上落满窗外的光——她的呼吸很近，近得${W("鲸鱼娘")}能听见自己的心跳，一声比一声不听话。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（笑意很浅，声音比灯还轻）那就别装了。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `后面的话，灯影替她们说了。窗外又是一轮烟花——屋里那点光，晃了一下，就再没稳下来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `不知过了多久，窗外安静下来。最后的烟花落尽，只剩云在夜里慢慢走。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-7", "cg-ylyyw-7");
            narration.dialogue = {
                text: `${W("鲸鱼娘")}把手往被子上一放，没放稳——另一只手从旁边伸过来，指节扣住指节，扣得刚刚好。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（声音有点哑，还是不看她）喂。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（喉咙很轻）嗯。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（很久，才把后半句说完）……今晚别走。`,
            };
        },
        async () => {
            await showCanvasBackground("cg-ylyyw-8", "cg-ylyyw-8");
            narration.dialogue = {
                text: `灯会散的时候，天边已经泛灰。窗开着一条缝，风把灯芯的余温一点点吹凉。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `${W("鲸鱼娘")}的尾巴还垂在床边，尾尖凝着的水珠，一滴，一滴，落在地板上。白龙尾松松搭在它上面，像条睡着的围巾。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `地板上，两双鞋并排放着——跟它们的主人一样，谁也不打算先动。`,
            };
        },
        () => {
            narration.dialogue = {
                character: dragon,
                text: `（半睡半醒，尾巴尖敲了敲地板）明年的灯会……你也得来。`,
            };
        },
        () => {
            narration.dialogue = {
                character: whale,
                text: `（被子底下，手指扣得更紧了一点）嗯。来。`,
            };
        },
        () => {
            narration.dialogue = {
                text: `云上的日头升起来时，灯全灭了。只有尾尖上那颗最后的水珠还亮着——像这一夜，被人偷偷留下了一小块。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // 背景由 manifest bundle "extra-yulongwu" 预载（8 张连续 CG）
        },
    },
);