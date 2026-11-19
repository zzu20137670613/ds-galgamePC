/**
 * 首次启动的隐私政策同意弹窗。
 *
 * 上架渠道（TapTap 等）要求：首次启动必须展示隐私政策，并由用户主动同意后才能进入。
 * 这里用纯 DOM 实现、不依赖 React —— 它要在 React 挂载之前就跑完。
 * 同意结果写 localStorage，之后不再弹出。
 */

/** 版本号化：将来隐私政策有重大变更时改成 v2，会重新询问一次 */
const CONSENT_KEY = "privacy-consent-v1";
const POLICY_URL = "https://api.kuaiyingai.cloud/download/privacy.html";

const C = {
    overlay: "rgba(2,10,20,0.86)",
    panel: "linear-gradient(180deg, rgba(9,26,42,0.98), rgba(6,18,30,0.99))",
    border: "rgba(56,189,248,0.35)",
    title: "#7dd3fc",
    text: "#cbd5e1",
    muted: "rgba(148,163,184,0.85)",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.12)",
    warn: "#fda4af",
};

export function ensurePrivacyConsent(): Promise<void> {
    try {
        if (localStorage.getItem(CONSENT_KEY) === "accepted") {
            return Promise.resolve();
        }
    } catch {
        // localStorage 不可用（极少数隐私模式）时不阻断游戏，直接放行
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const layer = document.createElement("div");
        layer.style.cssText = [
            "position:fixed",
            "inset:0",
            "z-index:99999",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "background:" + C.overlay,
            "backdrop-filter:blur(4px)",
            "padding:16px",
            "font-family:inherit",
            "line-height:1.75",
        ].join(";");

        const box = document.createElement("div");
        box.style.cssText = [
            "width:min(560px,100%)",
            "max-height:92vh",
            "overflow:auto",
            "box-sizing:border-box",
            "background:" + C.panel,
            "border:1px solid " + C.border,
            "border-radius:14px",
            "padding:26px 28px",
            "display:flex",
            "flex-direction:column",
            "gap:14px",
            "box-shadow:0 24px 60px rgba(0,0,0,0.55)",
        ].join(";");

        const title = document.createElement("div");
        title.textContent = "隐私政策";
        title.style.cssText = [
            "color:" + C.title,
            "font-size:19px",
            "letter-spacing:0.08em",
            "text-align:center",
            "padding-bottom:8px",
            "border-bottom:1px solid " + C.border,
        ].join(";");

        const body = document.createElement("div");
        body.style.cssText = "color:" + C.text + ";font-size:14px;display:flex;flex-direction:column;gap:8px";

        const intro = document.createElement("p");
        intro.textContent = "开始之前，请了解本作如何处理你的信息：";
        intro.style.cssText = "margin:0;" + "color:" + C.muted;

        const items: string[] = [
            "本作是单机游戏，不收集账号、通讯录、位置等个人信息。",
            "你的称呼、生日、API Key、存档与对话记录只保存在本机。",
            "实时对话由你的设备直连 DeepSeek，不经过我们的服务器。",
            "只有你主动填写并点击发送的「玩家留言」会上传（署名、回信地址、正文）。",
        ];

        body.append(intro);
        for (const text of items) {
            const line = document.createElement("div");
            line.textContent = "· " + text;
            body.append(line);
        }

        const linkRow = document.createElement("div");
        linkRow.style.cssText = "margin-top:6px;font-size:13px;color:" + C.muted;

        const link = document.createElement("a");
        link.href = POLICY_URL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "查看完整隐私政策";
        link.style.cssText = "color:" + C.accent + ";text-decoration:underline;cursor:pointer";
        link.addEventListener("click", (e) => {
            // Electron / 浏览器里都优先用系统默认方式打开，失败时至少链接文本可复制
            try {
                e.preventDefault();
                window.open(POLICY_URL, "_blank", "noopener,noreferrer");
            } catch {
                /* 拦截就让它按 href 走 */
            }
        });

        const urlTip = document.createElement("div");
        urlTip.textContent = POLICY_URL;
        urlTip.style.cssText = "font-size:12px;color:" + C.muted + ";word-break:break-all;margin-top:2px";

        linkRow.append(link, urlTip);

        const footer = document.createElement("div");
        footer.style.cssText = "display:flex;gap:12px;margin-top:6px";

        const agree = document.createElement("button");
        agree.type = "button";
        agree.textContent = "同意并继续";
        agree.style.cssText = primaryButton();

        const decline = document.createElement("button");
        decline.type = "button";
        decline.textContent = "不同意";
        decline.style.cssText = secondaryButton();

        footer.append(agree, decline);
        box.append(title, body, linkRow, footer);
        layer.appendChild(box);
        document.body.appendChild(layer);

        let done = false;

        agree.addEventListener("click", () => {
            if (done) return;
            done = true;
            try {
                localStorage.setItem(CONSENT_KEY, "accepted");
            } catch {
                /* 写不进去就下次再问，不影响本次进入 */
            }
            layer.remove();
            resolve();
        });

        decline.addEventListener("click", () => {
            // 不同意：不进入游戏，只留下说明。用户可自行关闭应用。
            body.replaceChildren();
            const msg = document.createElement("div");
            msg.textContent =
                "需要同意隐私政策才能使用本应用。若你不同意，请直接关闭本程序；你也可以随时重新打开并再次阅读。";
            msg.style.cssText = "color:" + C.text + ";font-size:14px";
            body.append(msg);
            linkRow.remove();
            footer.replaceChildren();
            const hint = document.createElement("div");
            hint.textContent = "现在可以关闭本应用了。";
            hint.style.cssText = "color:" + C.warn + ";font-size:13px;text-align:center;padding-top:4px";
            box.append(hint);
        });
    });
}

function primaryButton() {
    return [
        "flex:1",
        "height:44px",
        "border-radius:8px",
        "font-size:15px",
        "font-weight:600",
        "letter-spacing:0.06em",
        "cursor:pointer",
        "border:1px solid " + C.accent,
        "background:" + C.accent,
        "color:#04121f",
    ].join(";");
}

function secondaryButton() {
    return [
        "flex:1",
        "height:44px",
        "border-radius:8px",
        "font-size:15px",
        "letter-spacing:0.06em",
        "cursor:pointer",
        "border:1px solid " + C.border,
        "background:transparent",
        "color:" + C.text,
    ].join(";");
}