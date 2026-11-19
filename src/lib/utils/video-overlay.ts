/**
 * 全屏视频覆盖层：番外结尾播放 MP4，播完（或点击）自动移除并返回。
 *
 * 为什么不用 Pixi 纹理：MP4 解码依赖浏览器原生能力，走 HTML5 <video>
 * 叠在 canvas 之上最稳，也省掉一整套 VideoTexture 的兼容处理。
 */
export function playVideoOverlay(src: string): Promise<void> {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.src = src;
        video.autoplay = true;
        video.playsInline = true;
        video.style.cssText = [
            "position:fixed",
            "inset:0",
            "width:100%",
            "height:100%",
            "object-fit:contain",
            "background:#000",
            "z-index:9999",
        ].join(";");

        // 跳过提示：半透明小胶囊，不拦截点击（pointer-events: none）
        const hint = document.createElement("div");
        hint.textContent = "点击跳过";
        hint.style.cssText = [
            "position:fixed",
            "right:24px",
            "bottom:20px",
            "padding:6px 14px",
            "border-radius:999px",
            "background:rgba(0,0,0,0.45)",
            "color:rgba(255,255,255,0.75)",
            "font-size:13px",
            "letter-spacing:0.08em",
            "pointer-events:none",
            "z-index:10000",
        ].join(";");

        let done = false;
        let canSkip = false;
        // 播放初期忽略点击：玩家推进剧情习惯连点，视频刚出现就被点掉，
        // 表现为「没看到视频就回到上一页」。给 2.5 秒缓冲，之后再允许点击跳过。
        const skipGuard = setTimeout(() => {
            canSkip = true;
        }, 2500);

        const finish = () => {
            if (done) {
                return;
            }
            done = true;
            clearTimeout(skipGuard);
            video.pause();
            video.remove();
            hint.remove();
            resolve();
        };

        video.addEventListener("ended", finish);
        // 解码失败或文件缺失时也要放行，否则会卡在番外结尾出不去
        video.addEventListener("error", finish);
        // 点击画面可提前跳过（保护期内无效，避免连点误触）
        video.addEventListener("click", () => {
            if (canSkip) {
                finish();
            }
        });

        document.body.appendChild(video);
        document.body.appendChild(hint);
        // 先静音播放：静音播放不受「用户手势」限制，WebView / 移动端也能起播；
        // 播起来后再取消静音（播放中改 muted 不会被策略拦下，也不会暂停）。
        // 只靠 play() 的 catch 打开 controls 是不够的——那会留下一块不会动的黑屏。
        video.muted = true;
        void video
            .play()
            .then(() => {
                video.muted = false;
            })
            .catch(() => {
                // 极少数环境连静音播放也拒：退化成手动播放，至少给个能点的控制条
                video.controls = true;
                void video.play().catch(() => {});
            });
    });
}
