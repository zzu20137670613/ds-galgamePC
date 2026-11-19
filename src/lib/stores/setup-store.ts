import { Store } from "@tanstack/store";
import { CONTEXT_LIMIT_OPTIONS, DEFAULT_CONTEXT_LIMIT } from "@/lib/utils/token-estimate";

const LS_PLAYER_NAME = "gal_player_name";
const LS_WHALE_NAME = "gal_whale_name";
const LS_API_KEY = "gal_api_key";
const LS_MODEL_NAME = "gal_model_name";
/** 生日：只存 "MM-DD"（不存年份）；空串 = 没填。逻辑见 lib/birthday.ts */
const LS_BIRTHDAY = "gal_birthday";
/** 对话上下文上限（token 数）：设置 → 对话上下文 里换档 */
const LS_CONTEXT_LIMIT = "gal_context_limit";

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
     * 生日："MM-DD"，空串 = 没填。只存月日，不收集年份（见 lib/birthday.ts）
     */
    birthday: string;
    /**
     * 对话上下文上限（token 数）：达到该估算值时提醒玩家保留记忆 / 封卷。
     * 默认 55k，可选档位见 token-estimate.ts 的 CONTEXT_LIMIT_OPTIONS。
     */
    contextLimit: number;
    /**
     * 是否已完成开场设定（用于 onEnd 判断跳转：进聊天界面而不是回主菜单）
     */
    onboardingDone: boolean;
    /**
     * "idle" 表示正在正常对话；"setup" 表示当前正弹出一个三字段设定表单（InputRequestDialog 会据此切换渲染）
     */
    formMode: "idle" | "setup";
};

function readStored(): Pick<
    SetupState,
    "playerName" | "whaleName" | "apiKey" | "modelName" | "birthday" | "contextLimit"
> {
    // SSR（Vite 插件评估 content 模块时）没有 localStorage，返回空值回退
    if (typeof localStorage === "undefined") {
        return {
            playerName: "",
            whaleName: "鲸鲸",
            apiKey: "",
            modelName: DEFAULT_MODEL_NAME,
            birthday: "",
            contextLimit: DEFAULT_CONTEXT_LIMIT,
        };
    }
    const storedModel = localStorage.getItem(LS_MODEL_NAME) ?? "";
    const storedContextLimit = Number(localStorage.getItem(LS_CONTEXT_LIMIT));
    return {
        playerName: localStorage.getItem(LS_PLAYER_NAME) ?? "",
        whaleName: localStorage.getItem(LS_WHALE_NAME) ?? "鲸鲸",
        apiKey: localStorage.getItem(LS_API_KEY) ?? "",
        // 空值或历史遗留值都视为"未自定义"，跟随新默认模型
        modelName:
            storedModel && !LEGACY_MODEL_NAMES.has(storedModel) ? storedModel : DEFAULT_MODEL_NAME,
        birthday: localStorage.getItem(LS_BIRTHDAY) ?? "",
        // 只认档位表里的值，坏值/旧值一律回默认（防止手改 localStorage 把提醒关死）
        contextLimit: (CONTEXT_LIMIT_OPTIONS as readonly number[]).includes(storedContextLimit)
            ? storedContextLimit
            : DEFAULT_CONTEXT_LIMIT,
    };
}

function writeStored(
    state: Pick<
        SetupState,
        "playerName" | "whaleName" | "apiKey" | "modelName" | "birthday" | "contextLimit"
    >,
) {
    if (typeof localStorage === "undefined") {
        return;
    }
    localStorage.setItem(LS_PLAYER_NAME, state.playerName);
    localStorage.setItem(LS_WHALE_NAME, state.whaleName);
    localStorage.setItem(LS_API_KEY, state.apiKey);
    localStorage.setItem(LS_MODEL_NAME, state.modelName);
    localStorage.setItem(LS_BIRTHDAY, state.birthday);
    localStorage.setItem(LS_CONTEXT_LIMIT, String(state.contextLimit));
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

    /** 设置/清空生日（"MM-DD"，传空串 = 清空） */
    export function setBirthday(value: string) {
        store.setState((state) => ({ ...state, birthday: value }));
        writeStored(store.state);
    }

    /** 切换对话上下文档位（只接受档位表里的值，其它一律回默认） */
    export function setContextLimit(value: number) {
        const next = (CONTEXT_LIMIT_OPTIONS as readonly number[]).includes(value)
            ? value
            : DEFAULT_CONTEXT_LIMIT;
        store.setState((state) => ({ ...state, contextLimit: next }));
        writeStored(store.state);
    }

    export function commit(values: {
        playerName: string;
        whaleName: string;
        apiKey: string;
        modelName: string;
        /** 生日可不填：不传则保留原值 */
        birthday?: string;
    }) {
        const next = {
            playerName: values.playerName.trim() || "旅人",
            whaleName: values.whaleName.trim() || "鲸鲸",
            apiKey: values.apiKey.trim(),
            modelName: values.modelName.trim() || DEFAULT_MODEL_NAME,
            birthday: values.birthday === undefined ? store.state.birthday : values.birthday,
            // 开场表单不管上下文，沿用设置里已存的档位
            contextLimit: store.state.contextLimit,
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
