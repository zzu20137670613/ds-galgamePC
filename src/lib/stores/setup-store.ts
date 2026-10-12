import { Store } from "@tanstack/store";

const LS_PLAYER_NAME = "gal_player_name";
const LS_WHALE_NAME = "gal_whale_name";
const LS_API_KEY = "gal_api_key";
const LS_MODEL_NAME = "gal_model_name";

/**
 * 默认模型：deepseek-flash（即 V4.1 Flash，自带识图）。
 * ⚠️ API 只认 model id：实测后台只接受 deepseek-flash / deepseek-v4-pro，
 * 传展示名 "DeepSeek-V4.1-Flash" 会被拒：
 * "The supported API model names are deepseek-flash, deepseek-v4-pro, but you passed ..."
 */
export const DEFAULT_MODEL_NAME = "deepseek-flash";

/**
 * 需要迁移掉的历史值（读到就视为"未自定义"，改用当前默认）：
 * - "deepseek-chat"：旧版本内置默认（纯文本，不能识图）
 * - "DeepSeek-V4.1-Flash"：曾被写成默认的展示名，API 不认
 */
const LEGACY_MODEL_NAMES = new Set(["deepseek-chat", "DeepSeek-V4.1-Flash"]);

/**
 * 开局设定信息：玩家名字、鲸鱼娘名字、API、模型。
 * 持久化在 localStorage，下次打开游戏自动带出。
 */
export type SetupState = {
    playerName: string;
    whaleName: string;
    apiKey: string;
    /**
     * 模型名：用户自定，DeepSeek API 全量透传（默认 deepseek-flash，自带识图）
     */
    modelName: string;
    /**
     * 是否已完成开场设定（用于 onEnd 判断跳转：进聊天界面而不是回主菜单）
     */
    onboardingDone: boolean;
    /**
     * "idle" 表示正在正常对话；"setup" 表示当前正弹出一个三字段设定表单（InputRequestDialog 会据此切换渲染）
     */
    formMode: "idle" | "setup";
};

function readStored(): Pick<SetupState, "playerName" | "whaleName" | "apiKey" | "modelName"> {
    // SSR（Vite 插件评估 content 模块时）没有 localStorage，返回空值回退
    if (typeof localStorage === "undefined") {
        return { playerName: "", whaleName: "鲸鲸", apiKey: "", modelName: DEFAULT_MODEL_NAME };
    }
    const storedModel = localStorage.getItem(LS_MODEL_NAME) ?? "";
    return {
        playerName: localStorage.getItem(LS_PLAYER_NAME) ?? "",
        whaleName: localStorage.getItem(LS_WHALE_NAME) ?? "鲸鲸",
        apiKey: localStorage.getItem(LS_API_KEY) ?? "",
        // 空值或历史遗留值都视为"未自定义"，跟随新默认模型
        modelName:
            storedModel && !LEGACY_MODEL_NAMES.has(storedModel)
                ? storedModel
                : DEFAULT_MODEL_NAME,
    };
}

function writeStored(state: Pick<SetupState, "playerName" | "whaleName" | "apiKey" | "modelName">) {
    if (typeof localStorage === "undefined") {
        return;
    }
    localStorage.setItem(LS_PLAYER_NAME, state.playerName);
    localStorage.setItem(LS_WHALE_NAME, state.whaleName);
    localStorage.setItem(LS_API_KEY, state.apiKey);
    localStorage.setItem(LS_MODEL_NAME, state.modelName);
}

export namespace SetupStore {
    export const store = new Store<SetupState>({
        ...readStored(),
        onboardingDone: false,
        formMode: "idle",
    });

    export function openSetupForm() {
        store.setState((state) => ({ ...state, formMode: "setup" }));
    }

    export function closeSetupForm() {
        store.setState((state) => ({ ...state, formMode: "idle" }));
    }

    export function setPlayerName(value: string) {
        store.setState((state) => ({ ...state, playerName: value }));
        writeStored(store.state);
    }

    export function setWhaleName(value: string) {
        store.setState((state) => ({ ...state, whaleName: value }));
        writeStored(store.state);
    }

    export function setApiKey(value: string) {
        store.setState((state) => ({ ...state, apiKey: value }));
        writeStored(store.state);
    }

    export function setModelName(value: string) {
        store.setState((state) => ({ ...state, modelName: value }));
        writeStored(store.state);
    }

    export function commit(values: {
        playerName: string;
        whaleName: string;
        apiKey: string;
        modelName: string;
    }) {
        const next = {
            playerName: values.playerName.trim() || "旅人",
            whaleName: values.whaleName.trim() || "鲸鲸",
            apiKey: values.apiKey.trim(),
            modelName: values.modelName.trim() || DEFAULT_MODEL_NAME,
            onboardingDone: true,
            formMode: "idle" as const,
        };
        store.setState(() => next as SetupState);
        writeStored(next);
    }
}

/**
 * 骰子随机名字池：以海洋/深蓝/远方意象为主，兼顾可作昵称。
 */
export const RANDOM_NAME_POOL = [
    "潮生",
    "听澜",
    "归澜",
    "拾贝",
    "望海",
    "流汐",
    "沉蓝",
    "晓风",
    "无澜",
    "观海",
    "沧浪",
    "识潮",
    "逐浪",
    "问潮",
    "临渊",
    "浅潜",
    "映蓝",
    "慕鲸",
];

export function rollRandomName(): string {
    const pool = RANDOM_NAME_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
}