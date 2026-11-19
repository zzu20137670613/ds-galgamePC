import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

/**
 * favicon 的多尺寸帧由 scripts/build-favicon.mjs 生成（16/32/48/256 四帧）。
 *
 * 这里刻意不改 preset 的 `favicons` —— 它的 `[[size, "favicon.ico"], ...]`
 * 每生成一个尺寸都会用同名文件覆盖，传多个尺寸最后只剩最后一帧（实测是 256）。
 * 所以让生成器照常出 48 单帧，再由 prebuild 里的脚本覆盖成多帧。
 */
export default defineConfig({
    preset: minimal2023Preset,
    images: ["public/图标/icon.png"],
});
