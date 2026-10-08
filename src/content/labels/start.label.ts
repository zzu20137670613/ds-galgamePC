import { mc, whale } from "@/content/characters";
import { SetupStore } from "@/lib/stores/setup-store";
import { showCanvasBackground } from "@/lib/utils/assets-utility";
import { narration, newLabel } from "@drincs/pixi-vn";

/**
 * 游戏开场：春日水边的亭台，鲸鱼娘在这里等着玩家。
 * 收集三项设定（玩家名 / 鲸鱼娘名 / API），确认后开场结束，回到主菜单。
 */
export const startLabel = newLabel(
    "start",
    [
        async () => {
            await showCanvasBackground("bg", "bg-lakeside");
            narration.dialogue = {
                character: whale,
                text: `你好啊，我终于找到你了。`,
            };
        },
        async () => {
            narration.dialogGlue = true;
            narration.dialogue = `我在这片水边等了你好久呢。`;
        },
        () => {
            // 打开三字段设定表单（InputRequestDialog 检测到 setup 模式会切换渲染）
            SetupStore.openSetupForm();
            narration.requestInput({ type: "string" });
            narration.dialogue = {
                character: whale,
                text: `在开始之前，先告诉我几件事好不好？`,
            };
        },
        (props) => {
            props.invalidateInterfaceData();
            const { playerName, whaleName } = SetupStore.store.state;
            mc.name = playerName;
            whale.name = whaleName;
            narration.dialogue = {
                character: whale,
                text: `${playerName}，和我一起探索未至之境吧。`,
            };
        },
    ],
    {
        onLoadingLabel: () => {
            // start label 的资源由 manifest 中的 bundle 自动预载
        },
    },
);