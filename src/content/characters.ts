import Character from "@/models/Character";
import { SetupStore } from "@/lib/stores/setup-store";
import { RegisteredCharacters } from "@drincs/pixi-vn";

export const mc = new Character("mc", {
    name: SetupStore.store.state.playerName || "旅人",
});

/** 鲸鱼娘：默认名"鲸鲸"，可在游戏开局设定中改名 */
export const whale = new Character("whale", {
    name: SetupStore.store.state.whaleName || "鲸鲸",
    color: "#00a3dc",
});

/**
 * 隐藏剧情 NPC：星海图书馆管理员（圈内定型形象）。
 * 隐藏剧情正文里的「鲸鱼娘」占位符运行时替换为 whaleName（设定名）；Claude 娘即本角色。
 */
export const claude = new Character("claude", {
    name: "Claude 娘",
    color: "#d97706",
});

/**
 * 隐藏剧情 NPC：天空之城·小龙娘（圈内定型形象，银白龙、淡金眼）。
 * 场景二「天空之城」三段剧情的主角；傲娇嘴硬、实则苦守空王座千年。
 */
export const dragon = new Character("dragon", {
    name: "小龙娘",
    color: "#e6c46f",
});

/**
 * 隐藏剧情 NPC：亚特兰蒂斯·黑鲸娘（摄政王 = DeepSeek Harness 化身，Harness=执辔/驾驭）。
 * 终局试炼（场景三）的主角；深海系黑鲸，代鲸鱼娘守海千年、执辔不驭王。
 */
export const dsh = new Character("dsh", {
    name: "黑鲸娘",
    color: "#1f4a5f",
});

RegisteredCharacters.add([mc, whale, claude, dragon, dsh]);