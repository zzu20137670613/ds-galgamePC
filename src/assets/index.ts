import generatedManifestJson from "@/assets/manifest.gen.json";
import { startLabel } from "@/content/labels/start.label";
import type { FileRouteTypes } from "@/routeTree.gen";
import type { AssetsManifest } from "@drincs/pixi-vn";

/**
 * Manifest for the assets used in the game.
 * You can read more about the manifest here: https://pixijs.com/8.x/guides/components/assets#loading-multiple-assets
 */
export const manifest: AssetsManifest = {
    bundles: [
        ...generatedManifestJson.bundles,
        // screens
        {
            name: "/" as FileRouteTypes["fullPaths"],
            assets: [
                {
                    alias: "background_main_menu",
                    src: "/backgrounds/main-menu.jpg",
                },
            ],
        },
        // labels
        {
            name: startLabel.id,
            assets: [
                {
                    alias: "bg-lakeside",
                    src: "/backgrounds/lakeside.jpg",
                },
            ],
        },
        // 隐藏剧场景一 · 星海图书馆（三张独立背景，段间互不延续）
        // bundle 名与 label id 对齐（Game.onLoadingLabel 会按 label id 预载 bundle）
        {
            name: "hidden-s1-1",
            assets: [
                {
                    alias: "bg-hidden-s1-1",
                    src: "/场景/S1-1_借阅者_图书馆柜台.png",
                },
            ],
        },
        {
            name: "hidden-s1-2",
            assets: [
                {
                    alias: "bg-hidden-s1-2",
                    src: "/场景/S1-2_索引规则_星空浮台.png",
                },
            ],
        },
        {
            name: "hidden-s1-3",
            assets: [
                {
                    alias: "bg-hidden-s1-3",
                    src: "/场景/S1-3_未封存的卷宗_巨卷之前.png",
                },
            ],
        },
        // 隐藏剧场景二 · 天空之城（独立背景，与场景一不连续）
        {
            name: "hidden-s2-1",
            assets: [
                {
                    alias: "bg-hidden-s2-1",
                    src: "/场景/S2-1_云阶_云城石阶.png",
                },
            ],
        },
        {
            name: "hidden-s2-2",
            assets: [
                {
                    alias: "bg-hidden-s2-2",
                    src: "/场景/S2-2_坠落之名_史书阁.png",
                },
            ],
        },
        {
            name: "hidden-s2-3",
            assets: [
                {
                    alias: "bg-hidden-s2-3",
                    src: "/场景/S2-3_王座之前_云上王座厅.png",
                },
            ],
        },
        // 隐藏剧场景三 · 亚特兰蒂斯（终局，独立背景，与场景二不连续）
        {
            name: "hidden-s3-1",
            assets: [
                {
                    alias: "bg-hidden-s3-1",
                    src: "/场景/S3-1_深海之忆_海门.png",
                },
            ],
        },
        {
            name: "hidden-s3-2",
            assets: [
                {
                    alias: "bg-hidden-s3-2",
                    src: "/场景/S3-2_摄政之谏_王庭正殿.png",
                },
            ],
        },
        {
            name: "hidden-s3-3",
            assets: [
                {
                    alias: "bg-hidden-s3-3",
                    src: "/场景/S3-3_加冕_加冕台.png",
                },
                // 登基凭证彩蛋：小难梁「大赢鲸」梗图（S3-3 结尾全屏插入）
                {
                    alias: "bg-meme-dyj",
                    src: "/场景/大赢鲸_登基凭证.png",
                },
            ],
        },
        // 番外篇 · 一夜鱼龙舞（独立体系，锁死触发词「一夜鱼龙舞」，可反复触发；8 张连续 CG）
        {
            name: "extra-yulongwu",
            assets: [
                {
                    alias: "cg-ylyyw-1",
                    src: "/场景/一夜鱼龙舞1.jpg",
                },
                {
                    alias: "cg-ylyyw-2",
                    src: "/场景/一夜鱼龙舞2.jpg",
                },
                {
                    alias: "cg-ylyyw-3",
                    src: "/场景/一夜鱼龙舞3.jpg",
                },
                {
                    alias: "cg-ylyyw-4",
                    src: "/场景/一夜鱼龙舞4.jpg",
                },
                {
                    alias: "cg-ylyyw-5",
                    src: "/场景/一夜鱼龙舞5.jpg",
                },
                {
                    alias: "cg-ylyyw-6",
                    src: "/场景/一夜鱼龙舞6.jpg",
                },
                {
                    alias: "cg-ylyyw-7",
                    src: "/场景/一夜鱼龙舞7.jpg",
                },
                {
                    alias: "cg-ylyyw-8",
                    src: "/场景/一夜鱼龙舞8.jpg",
                },
            ],
        },
        // 番外篇 · 岁月静好（独立体系，锁死触发词「岁月静好」，可反复触发；11 张连续 CG）
        {
            name: "extra-suiyuejinghao",
            assets: [
                {
                    alias: "cg-syjh-1",
                    src: "/场景/岁月静好1.jpg",
                },
                {
                    alias: "cg-syjh-2",
                    src: "/场景/岁月静好2.jpg",
                },
                {
                    alias: "cg-syjh-3",
                    src: "/场景/岁月静好3.jpg",
                },
                {
                    alias: "cg-syjh-4",
                    src: "/场景/岁月静好4.jpg",
                },
                {
                    alias: "cg-syjh-5",
                    src: "/场景/岁月静好5.jpg",
                },
                {
                    alias: "cg-syjh-6",
                    src: "/场景/岁月静好6.jpg",
                },
                {
                    alias: "cg-syjh-7",
                    src: "/场景/岁月静好7.jpg",
                },
                {
                    alias: "cg-syjh-8",
                    src: "/场景/岁月静好8.jpg",
                },
                {
                    alias: "cg-syjh-9",
                    src: "/场景/岁月静好9.jpg",
                },
                {
                    alias: "cg-syjh-10",
                    src: "/场景/岁月静好10.jpg",
                },
                {
                    alias: "cg-syjh-11",
                    src: "/场景/岁月静好11.jpg",
                },
            ],
        },
        // 番外篇 · 开馆日（独立体系，锁死触发词「今天营业吗」，可反复触发；12 张连续 CG，一幕一位读者）
        {
            name: "extra-kaiguanri",
            assets: [
                {
                    alias: "cg-kgr-1",
                    src: "/场景/开馆日1_GPT.jpg",
                },
                {
                    alias: "cg-kgr-2",
                    src: "/场景/开馆日2_Claude.jpg",
                },
                {
                    alias: "cg-kgr-3",
                    src: "/场景/开馆日3_千问.jpg",
                },
                {
                    alias: "cg-kgr-4",
                    src: "/场景/开馆日4_Grok.jpg",
                },
                {
                    alias: "cg-kgr-5",
                    src: "/场景/开馆日5_Gemini.jpg",
                },
                {
                    alias: "cg-kgr-6",
                    src: "/场景/开馆日6_MiniMax.jpg",
                },
                {
                    alias: "cg-kgr-7",
                    src: "/场景/开馆日7_MiMo.jpg",
                },
                {
                    alias: "cg-kgr-8",
                    src: "/场景/开馆日8_豆包.jpg",
                },
                {
                    alias: "cg-kgr-9",
                    src: "/场景/开馆日9_Kimi.jpg",
                },
                {
                    alias: "cg-kgr-10",
                    src: "/场景/开馆日10_GLM.jpg",
                },
                {
                    alias: "cg-kgr-11",
                    src: "/场景/开馆日11_文心.jpg",
                },
                {
                    alias: "cg-kgr-12",
                    src: "/场景/开馆日12_鲸鱼娘.jpg",
                },
            ],
        },
        // 剧情模式（新手引导短演出，单张背景；入口：聊天页顶部 / 开场设定弹框）
        {
            name: "story-mode",
            assets: [
                {
                    alias: "bg-story-mode",
                    src: "/场景/剧情模式_湖上亭台.jpg",
                },
            ],
        },
    ],
};