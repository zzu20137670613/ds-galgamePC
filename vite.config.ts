import { AssetPack } from "@assetpack/core";
import type { AssetsManifest } from "@drincs/pixi-vn/pixi.js";
import { vitePluginPixivn } from "@drincs/pixi-vn/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import { checker } from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import assetPackConfig from "./.assetpack.ts";

/**
 * List of external hostnames whose responses should be cached by the service worker.
 * Add any CDN or remote asset host here to enable offline caching for it.
 * Examples:
 *   "cdn.jsdelivr.net"
 *   "your.cdn.domain.com"
 */
const CACHED_EXTERNAL_HOSTNAMES: string[] = ["raw.githubusercontent.com"];

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    // 相对路径 base：Electron 用 file:// 加载 dist/index.html 时资源才能正确解析
    base: "./",
    plugins: [
        assetpackPlugin(),
        checker({
            typescript: {
                tsconfigPath: "tsconfig.app.json",
            },
        }),
        mode !== "production" && devtools(),
        tanstackRouter({ target: "react", autoCodeSplitting: true }),
        react(),
        tailwindcss(),
        vitePluginPixivn({
            content: "./src/content/index.ts",
            characters: "./src/content/characters.ts",
            labels: "./src/content/labels/*.label.ts",
            typeFilePath: "./src/pixi-vn.keys.gen.ts",
            assetsManifest: async (ssrLoadModule) => {
                const mod = (await ssrLoadModule("/src/assets/index.ts")) as {
                    manifest: AssetsManifest;
                };
                if (!mod.manifest)
                    throw new Error("Assets manifest not found in /src/assets/index.ts");
                return mod.manifest;
            },
        }),
        VitePWA({
            /*
             * 2026-10-19：改为「自毁」模式（selfDestroying）—— 本仓库只发 Windows exe，
             * 网页版只是作者自测用，Service Worker 在这里没有离线价值，却带来一个隐蔽的大坑：
             *   · sw.js 里有 `new NavigationRoute(createHandlerBoundToURL("index.html"))`，
             *     于是**每次打开都从预缓存里返回旧版 index.html**；
             *   · registerSW.js 又从不调 skipWaiting()，新 SW 装好也不接管 ⇒ 界面被钉在旧版。
             * 表现就是「装了新 exe，界面还是老样子」——已实测踩到（顶栏少两个按钮、
             * 挂件气泡少「距高峰」倒计时行，而包体里的 dist 其实是最新的）。
             * selfDestroying 让打包出的 SW 自己注销 + 清缓存：老用户升级后会被自动清干净，
             * 之后不再注册任何 SW，这类坑永久消失。
             * 注意：此模式下下面的 precache / runtimeCaching 不再生效（SW 只剩自毁动作）；
             * 若哪天要恢复真正的离线 PWA，把这一行删掉即可。
             */
            selfDestroying: true,
            // generate icons with: npm run icon
            includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
            manifest: {
                name: "深海回响",
                short_name: "深海回响",
                description: "DeepSeek Whale Galgame",
                theme_color: "#ffffff",
                start_url: "/",
                display: "fullscreen",
                orientation: "landscape",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => CACHED_EXTERNAL_HOSTNAMES.includes(url.hostname),
                        handler: "CacheFirst",
                        options: {
                            cacheName: "external-assets-v1",
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxAgeSeconds: 7 * 24 * 60 * 60,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        tsconfigPaths: true,
        preserveSymlinks: true,
    },
    server: {
        proxy: {
            // 浏览器直连大模型 API 会被 CORS 拦，统一走本地代理转发；
            // Electron/桌面端阶段可去掉 proxy、由主进程直接请求。
            "/dg-api": {
                target: "https://api.deepseek.com",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/dg-api/, ""),
            },
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __APP_NAME__: JSON.stringify(process.env.npm_package_name),
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (
                        id.includes("react-markdown") ||
                        id.includes("rehype-raw") ||
                        id.includes("remark-gfm")
                    )
                        return "markdown";
                    if (id.includes("tone")) return "tone";
                    if (id.includes("@drincs/pixi-vn-spine")) return "spine";
                    if (id.includes("pixi.js")) return "pixi.js";
                    if (id.includes("motion")) return "motion";
                    if (id.includes("@drincs/pixi-vn")) return "pixi-vn";
                },
            },
        },
    },
}));

function assetpackPlugin(): Plugin {
    let mode: ResolvedConfig["command"];
    let ap: AssetPack | undefined;

    return {
        name: "vite-plugin-assetpack",
        configResolved(resolvedConfig) {
            mode = resolvedConfig.command;
            if (!resolvedConfig.publicDir) return;
            if (assetPackConfig.output) return;
            const publicDir = resolvedConfig.publicDir.replace(process.cwd(), "");
            assetPackConfig.output = `.${publicDir}/assets/`;
        },
        buildStart: async () => {
            if (mode === "serve") {
                if (ap) return;
                ap = new AssetPack(assetPackConfig);
                void ap.watch();
            } else {
                await new AssetPack(assetPackConfig).run();
            }
        },
        buildEnd: async () => {
            if (ap) {
                await ap.stop();
                ap = undefined;
            }
        },
    };
}
