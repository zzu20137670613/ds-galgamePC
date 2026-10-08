import App from "@/App";
import {
    BGM_CHANNEL_NAME,
    CANVAS_UI_LAYER_NAME,
    HTML_CANVAS_LAYER_NAME,
    HTML_UI_LAYER_NAME,
    SFX_CHANNEL_NAME,
} from "@/constants";
import { ChannelSound } from "@/lib/stores/channel-sound-stores";
import { MasterSound } from "@/lib/stores/master-sound-storage";
import { SetupStore } from "@/lib/stores/setup-store";
import { SkipSettings } from "@/lib/stores/skip-settings-store";
import "@/styles.css";
import { Assets, canvas, Container, drawCanvasErrorHandler, Game, sound, NarrationManagerStatic } from "@drincs/pixi-vn";
import type { LabelIdType } from "@drincs/pixi-vn/narration";
import { createRoot } from "react-dom/client";
import { clearCurrentBackground } from "@/lib/utils/assets-utility";
import { bundleIds } from "@/pixi-vn.keys.gen";
import {
    clearActiveHiddenSeq,
    HIDDEN_LABELS,
    setActiveHiddenLabel,
    setActiveHiddenSeqFromLabel,
    takeActiveHiddenLabel,
    takePendingAutoLink,
} from "@/lib/archive/hidden-progress";

// Canvas setup with PIXI
const body = document.body;
if (!body) {
    throw new Error("body element not found");
}

Game.init(body, {
    id: HTML_CANVAS_LAYER_NAME,
    height: 1080,
    width: 1920,
    backgroundColor: "#303030",
    resizeMode: "contain",
}).then(() => {
    // Pixi.JS UI Layer
    canvas.addLayer(CANVAS_UI_LAYER_NAME, new Container());

    // Sound setup
    sound.addChannel(BGM_CHANNEL_NAME, { background: true });
    sound.addChannel(SFX_CHANNEL_NAME);
    sound.defaultChannelAlias = SFX_CHANNEL_NAME;
    MasterSound.init();
    ChannelSound.init();

    // React setup with ReactDOM
    const root = document.getElementById("root");
    if (!root) {
        throw new Error("root element not found");
    }

    const htmlLayout = canvas.addHtmlLayer(HTML_UI_LAYER_NAME, root);
    if (!htmlLayout) {
        throw new Error("htmlLayout not found");
    }
    const reactRoot = createRoot(htmlLayout);
    reactRoot.render(<App />);
});

Game.onEnd(async (props) => {
    // 刹车：跳过/快进只作用于当前这一个 label 段，段演完即停（防止连跳下一段造成无限跳过）
    SkipSettings.setEnabled(false);
    // ① 待衔接标记：探索第 5 次演完 → 直接衔接下一段全屏（跳过回聊天）
    const pendingLink = takePendingAutoLink();
    // ② 当前隐藏剧情记账（谁触发谁记）；⚠ 不要反查引擎 currentLabelId（onEnd 时已清栈）
    const activeHidden = takeActiveHiddenLabel();
    Game.clear();
    // 画布已清空，背景引用一并重置（避免 showCanvasBackground 对已销毁 sprite 误操作）
    clearCurrentBackground();
    if (pendingLink) {
        const target = HIDDEN_LABELS[pendingLink];
        if (target) {
            // 衔接的下一段仍是隐藏剧情：把记账延续过去，保证该段结束也能回聊天页
            setActiveHiddenLabel(activeHidden ?? target);
            // 角标切换到本段编号
            setActiveHiddenSeqFromLabel(target);
            await props.navigate({ to: "/game/narration" });
            await Game.start(target as LabelIdType, props);
            props.invalidateInterfaceData();
            return;
        }
    }
    // 隐藏剧情（含探索小剧情）结束 → 回聊天页继续日常
    if (activeHidden) {
        // 角标熄灭
        clearActiveHiddenSeq();
        props.navigate({ to: "/game/chat" });
        return;
    }
    // 开场设定完成后（玩家填好名字/鲸名/API），剧情结束直接进入「未至之境」聊天界面；
    // 否则（正常回主菜单路径）回到首页主菜单。
    const onboardingDone = SetupStore.store.state.onboardingDone;
    props.navigate({ to: onboardingDone ? "/game/chat" : "/" });
});

Game.addOnError(drawCanvasErrorHandler());
Game.addOnError((error, { toast, uiTransition }) => {
    toast && uiTransition && toast.error(uiTransition("allert_error_occurred"));
    console.error(`Error occurred`, error);
});

Game.onLoadingLabel((_stepId, { id }) => {
    // 仅当该 id 对应 manifest 里的 bundle 时才后台预载；
    // 探索小剧情（explore-s1-*）没有独立 bundle，由 label 内部自行加载所需背景。
    if ((bundleIds as readonly string[]).includes(id)) {
        Assets.backgroundLoadBundle(id);
    }
});
