/**
 * 生成多尺寸 ico，产出两份：
 *   1. public/图标/favicon.ico —— 网页 favicon / PWA
 *   2. build/icon.ico          —— electron-builder 打包用的 exe / 安装器 / 桌面快捷方式 / 任务栏图标
 *
 * ★ 关键：exe 图标必须走 build/icon.ico。之前 win.icon 指向 build/icon.png（旧的纯白底
 *   原图），electron-builder 会把它转成白底 ico，导致桌面快捷方式和任务栏图标都带白底板，
 *   而网页 favicon 已经是透明版 —— 两边不一致。
 *
 * 为什么不用 pwa-assets-generator 的 preset：
 * 它的 `favicons: [[size, 文件名]]` 每生成一个尺寸就用同名文件覆盖一次，
 * 传四个尺寸进去最后只剩最后一个（256 单帧），拿不到多帧。
 * 所以这里先用 ffmpeg 把源图缩成多个尺寸，再按 ICO 容器格式手工拼起来。
 *
 * 由 package.json 的 prebuild 在 `npm run icon` 之后调用，
 * 顺序不能反 —— 否则生成器会把这里产出的多帧 ico 覆盖回 48 单帧。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const FFMPEG = "node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe";
/** 用透明底版本：图标显示在任务栏/书签栏/桌面上，透明底比白底自然 */
const SRC = "public/图标/icon-transparent.png";
const TMP = ".favicon-tmp";
const FAVICON_OUT = "public/图标/favicon.ico";
/** Windows 任务栏 / 书签栏常用 16、32，高分屏用 256 */
const FAVICON_SIZES = [16, 32, 48, 256];
/** exe 图标：Windows 会按 DPI 挑 16/24/32/48/64/128/256，全给上 */
const APP_ICON_OUT = "build/icon.ico";
const APP_ICON_SIZES = [16, 24, 32, 48, 64, 128, 256];

if (!fs.existsSync(FFMPEG)) {
    console.error(`[favicon] 找不到 ffmpeg: ${FFMPEG}`);
    process.exit(1);
}
if (!fs.existsSync(SRC)) {
    console.error(`[favicon] 找不到源图: ${SRC}`);
    process.exit(1);
}

fs.mkdirSync(TMP, { recursive: true });

function buildIco(sizes, outPath, tag) {
    const frames = sizes.map((size) => {
        const png = path.join(TMP, `${tag}-${size}.png`);
        execFileSync(FFMPEG, [
            "-hide_banner", "-loglevel", "error", "-y",
            "-i", SRC,
            "-vf", `scale=${size}:${size}:flags=lanczos,format=rgba`,
            "-compression_level", "9",
            png,
        ]);
        return { size, data: fs.readFileSync(png) };
    });

    // ICO 容器：6 字节文件头 + 每帧 16 字节目录项 + 各帧数据
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type = icon
    header.writeUInt16LE(frames.length, 4);

    let offset = 6 + 16 * frames.length;
    const entries = frames.map((f) => {
        const e = Buffer.alloc(16);
        // 256 在目录项里必须写 0（1 字节存不下）
        e.writeUInt8(f.size === 256 ? 0 : f.size, 0);
        e.writeUInt8(f.size === 256 ? 0 : f.size, 1);
        e.writeUInt8(0, 2); // 调色板颜色数
        e.writeUInt8(0, 3); // 保留
        e.writeUInt16LE(1, 4); // 色彩平面
        e.writeUInt16LE(32, 6); // 位深
        e.writeUInt32LE(f.data.length, 8);
        e.writeUInt32LE(offset, 12);
        offset += f.data.length;
        return e;
    });

    fs.writeFileSync(outPath, Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]));
    console.log(`[favicon] 已生成 ${outPath}：${sizes.join(" / ")} 共 ${frames.length} 帧，${fs.statSync(outPath).size} 字节`);
}

buildIco(FAVICON_SIZES, FAVICON_OUT, "favicon");
buildIco(APP_ICON_SIZES, APP_ICON_OUT, "app");

fs.rmSync(TMP, { recursive: true, force: true });
