import { manifest } from "@/assets";
import { AUDIO_BUNDLE_NAME } from "@/constants";
import type { FileRouteTypes } from "@/routeTree.gen";
import { Assets, canvas, showImage, sound } from "@drincs/pixi-vn";
import type { ImageSprite, ImageSpriteOptions } from "@drincs/pixi-vn";

let assetsInitialized = false;

/**
 * Define all the assets that will be used in the game.
 * This function will be called before the game starts.
 * You can read more about assets management in the documentation: https://pixi-vn.com/start/assets-management.html
 */
export async function defineAssets() {
    if (!assetsInitialized) {
        await Assets.init({ manifest });
        assetsInitialized = true;
    }

    // The game will not start until these asserts are loaded.
    await Assets.loadBundle("/" as FileRouteTypes["fullPaths"]);

    // The audio bundle will be loaded in the background, so it will be available when needed, but it won't block the game start.
    sound.backgroundLoadBundle(AUDIO_BUNDLE_NAME);

    // The game will start immediately, but these asserts will be loaded in the background.
    // Assets.backgroundLoadBundle("main_menu");
    // Assets.backgroundLoad("background_main_menu");
}

/**
 * Get the PixiJS asset from the given asset string.
 * If the asset is not a PixiAsset, it will return the asset as is.
 * @param asset - The asset string to resolve.
 * @returns The resolved PixiJS asset or the original asset string.
 */
export function getPixiJSAsset(asset: string) {
    // check if the asset is a PixiAsset
    return Assets.resolver.resolve(asset).src || asset;
}

/**
 * 将背景图按「等比缩放、铺满画布、四周居中」的方式挂到画布上。
 * Pixi 默认按图片原始像素尺寸显示（如 836×605 的横版湖景在 1920×1080 画布里只会占左上角一小块），
 * 加载完成后调用本函数，即可等比放大到完整覆盖画布，避免出现原始尺寸/黑边/变形。
 * @param img 已加载 texture 的 ImageSprite
 * @param canvasWidth 画布逻辑宽度（默认取引擎 1920）
 * @param canvasHeight 画布逻辑高度（默认取引擎 1080）
 */
export function fitCanvasBackground(
    img: ImageSprite,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080,
): void {
    const tw = img.texture?.width ?? canvasWidth;
    const th = img.texture?.height ?? canvasHeight;
    if (tw === 0 || th === 0) return;
    // cover：等比放大取较大比例，裁切溢出部分，不留黑边
    const scale = Math.max(canvasWidth / tw, canvasHeight / th);
    img.anchor.set(0.5, 0.5);
    img.scale.set(scale, scale);
    img.x = canvasWidth / 2;
    img.y = canvasHeight / 2;
}

/**
 * ── 背景槽位（唯一入口，不要绕过）─────────────────────────────
 * 不变式：画布「游戏层」上任何时刻最多只有 1 张背景。
 * 历史教训：pixi-vn 的 showImage 对不同 alias 是「新增」而非「替换」；一旦有残留
 * （在途加载晚于清场就位、记账丢失、未来新流程忘记清场……），残图会透过聊天页
 * 40% 透明背景显影，叠成「两张背景」（白纱重影），且每次大更新都容易复发。
 * 因此这里做四层防御，效果与调用点纪律解耦：
 *   ① 换图前销毁全部已知背景 sprite（全量 Set，而非只记最后一张）；
 *   ② 清场时「代次」+1 —— 在途 show 只要跨过一次清场，落地即自毁（掐死竞态）；
 *   ③ 清场时无状态兜底清扫 canvas.gameLayer —— 丢记账 / HMR / 绕过本函数，都不怕；
 *   ④ 同 alias 并发调用合并为同一次加载 —— 探索 label 的 onLoadingLabel 与首步会各调一次，
 *      不合并就会并发加载同一张图（历史「双 sprite / 迟到落地」类 bug 的温床）。
 * 新内容（新剧情 / 新玩法）一律通过 showCanvasBackground 显示背景，自动获得保护。
 */
const backgroundSprites = new Set<ImageSprite>();
let backgroundEpoch = 0;
/** 同 alias 在途加载共享（见防御 ④） */
let inflightBackgroundLoad: { alias: string; promise: Promise<ImageSprite> } | null = null;

/** 销毁一张背景 sprite（幂等：已销毁/空引用直接跳过，异常只记日志不中断） */
function destroyBackgroundSprite(img: ImageSprite | null | undefined, why: string): void {
    if (!img || img.destroyed) return;
    try {
        img.destroy();
    } catch (e) {
        console.error(`销毁背景 sprite 失败（${why}）`, e);
    }
}

/** 主动清场：销毁全部已知背景 + 无状态清扫游戏层残留。
 * 调用时机：Game.onEnd（段演完）/ 聊天页挂载——都属于「画布应无内容」的时刻。 */
export function clearCurrentBackground(): void {
    backgroundEpoch += 1; // 所有在途 show 作废，落地即自毁
    inflightBackgroundLoad = null; // 清场后不再复用旧的在途加载（下一次同图调用重新加载）
    for (const s of backgroundSprites) destroyBackgroundSprite(s, "清场");
    backgroundSprites.clear();
    // 兜底：直接清空引擎游戏层的一切元素（该函数只在「画布应为空」的时机调用）
    try {
        const layer = canvas.gameLayer;
        if (!layer) return;
        for (const child of [...layer.children]) {
            try {
                child.destroy({ children: true });
            } catch (e) {
                console.error("清扫画布残留失败", e);
            }
        }
    } catch (e) {
        console.error("访问画布游戏层失败", e);
    }
}

/**
 * 显示一张「默认全屏适配」的背景图（全项目唯一背景入口）。
 * @param alias 画布上的唯一标识
 * @param src 图片地址或资源别名
 * @param options 透传给 showImage 的其他选项（不传时自动居中铺满画布）
 */
export async function showCanvasBackground(
    alias: string,
    src?: string,
    options?: ImageSpriteOptions,
): Promise<ImageSprite> {
    // ④ 同 alias 并发调用 → 复用同一次加载（避免双 sprite 落地）
    if (inflightBackgroundLoad && inflightBackgroundLoad.alias === alias) {
        return inflightBackgroundLoad.promise;
    }
    const task = loadAndInstallBackground(alias, src, options);
    inflightBackgroundLoad = { alias, promise: task };
    try {
        return await task;
    } finally {
        if (inflightBackgroundLoad?.promise === task) inflightBackgroundLoad = null;
    }
}

async function loadAndInstallBackground(
    alias: string,
    src?: string,
    options?: ImageSpriteOptions,
): Promise<ImageSprite> {
    const myEpoch = backgroundEpoch;
    // ① 换图前：清掉全部旧背景（同形态只允许一张）
    for (const s of backgroundSprites) destroyBackgroundSprite(s, "换图");
    backgroundSprites.clear();

    const img = await showImage(alias, src, options);

    // ② 代次校验：await 期间若发生过清场（段结束/回聊天页），这张是迟到的幽灵，直接销毁
    if (myEpoch !== backgroundEpoch) {
        destroyBackgroundSprite(img, "迟到作废");
        return img;
    }
    // 并发换图兜底：只保留「最后落地」的那张
    for (const s of backgroundSprites) destroyBackgroundSprite(s, "并发顶替");
    backgroundSprites.clear();

    fitCanvasBackground(img);
    backgroundSprites.add(img);

    // ③ dev 自检：落地后游戏层不该有别的元素，发现游离元素立即点名警告（防复发 guard）
    if (import.meta.env?.DEV) {
        try {
            const aliens = canvas.gameLayer?.children.filter((c) => c !== img) ?? [];
            if (aliens.length > 0) {
                console.warn(
                    "[背景槽位] 画布游戏层出现游离元素，存在背景叠加隐患，请检查是否有绕过 showCanvasBackground 的调用：",
                    aliens,
                );
            }
        } catch {
            /* dev 自检失败可忽略 */
        }
    }
    return img;
}
