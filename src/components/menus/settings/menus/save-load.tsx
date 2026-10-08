import { GameSaveMenu } from "@/components/menus/save-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGameProps } from "@/lib/hooks/props-hooks";
import {
    downloadGameSave,
    getQuickSaveIds,
    getSaveFromIndexDB,
    loadGameSaveFromFile,
} from "@/lib/utils/save-utility";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useLocation } from "@tanstack/react-router";
import { Download, FolderOpen, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function SaveLoadSettingsPage() {
    const { t } = useTranslation(["ui"]);
    const gameProps = useGameProps();
    const location = useLocation();
    const [showQuickSaves, setShowQuickSaves] = useState(false);

    // 存在快速存档时默认展示快存视图，避免一进来看到满屏空格子
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const slots = await Promise.all(getQuickSaveIds().map((id) => getSaveFromIndexDB(id)));
            if (!cancelled && slots.some((s) => s)) {
                setShowQuickSaves(true);
            }
        })().catch((e) => console.error("检查快速存档失败", e));
        return () => {
            cancelled = true;
        };
    }, []);

    const toolbar = (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger render={<span />}>
                        <Button
                            variant={showQuickSaves ? "secondary" : "ghost"}
                            size="icon-lg"
                            onClick={() => setShowQuickSaves((v) => !v)}
                            aria-pressed={showQuickSaves}
                            aria-label={t("quick_saves")}
                        >
                            <Zap className="size-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("quick_saves")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger render={<span />}>
                        <Button
                            variant="ghost"
                            size="icon-lg"
                            onClick={() =>
                                loadGameSaveFromFile((err) => {
                                    if (err) {
                                        toast.error(t("allert_error_occurred"));
                                        return;
                                    }
                                    gameProps.invalidateInterfaceData();
                                    toast.success(t("success_load"));
                                })
                            }
                            aria-label={t("load_from_file")}
                        >
                            <FolderOpen className="size-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("load_from_file")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger render={<span />}>
                        <Button
                            variant="ghost"
                            size="icon-lg"
                            onClick={() => downloadGameSave()}
                            disabled={(location.pathname as FileRouteTypes["fullPaths"]) === "/"}
                            aria-label={t("save_to_file")}
                        >
                            <Download className="size-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("save_to_file")}</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b p-4">{toolbar}</div>
            <GameSaveMenu quickSaves={showQuickSaves} />
        </div>
    );
}
