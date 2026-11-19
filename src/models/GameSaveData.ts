import type { GameState } from "@drincs/pixi-vn";
import type { ChatMessage } from "@/lib/archive/context-archive";
import type { HiddenProgress } from "@/lib/archive/hidden-progress";

export default interface GameSaveData {
    saveData: GameState;
    gameVersion: string;
    date: Date;
    name: string;
    image?: string;
    /**
     * 存档时绑定的对话全量上下文快照。
     * 主菜单「继续」读档时恢复进上下文层；旧版本存档没有该字段（读档时跳过恢复）。
     */
    conversation?: ChatMessage[];
    /**
     * 存档时绑定的隐藏剧情进度快照（每档各自带进度）。
     * 读档时恢复；旧版本存档没有该字段（读档时保留当前全局进度）。
     */
    hiddenProgress?: HiddenProgress;
}
