/**
 * 「创作不易」支持作者面板（番外收尾用）。
 *
 * 与 video-overlay 同一种做法：直接建 DOM 叠在 canvas 上，返回 Promise，
 * 玩家关掉后 label 继续往下走。用内联样式而不是 Tailwind 类，
 * 因为动态拼接的类名不会被构建时的样式扫描收集到。
 */

type SupportPage = "donate" | "custom";
type SupportRail = "wechat" | "alipay";

/** 每页每种支付方式下的两张码 */
const PLATES: Record<SupportPage, Record<SupportRail, [string, string]>> = {
    donate: {
        wechat: [
            "/assets/image/support/donate-wechat-a.jpg",
            "/assets/image/support/donate-wechat-b.jpg",
        ],
        alipay: [
            "/assets/image/support/donate-alipay-a.jpg",
            "/assets/image/support/donate-alipay-b.jpg",
        ],
    },
    custom: {
        wechat: [
            "/assets/image/support/custom-wechat-a.jpg",
            "/assets/image/support/custom-shared-b.png",
        ],
        alipay: [
            "/assets/image/support/custom-alipay-a.jpg",
            "/assets/image/support/custom-shared-b.png",
        ],
    },
};

const TEXT = {
    title: "创作不易，投枚硬币支持一下作者吧 （≽^⚈⩊⚈^≼）",
    coinLine: "投一枚硬币支持作者",
    hundredLine: "投一发百连支持作者",
    gachaLine: "投一发十连支持作者",
    wechat: "微信",
    alipay: "支付宝",
    custom: "找作者定制专属隐藏地图",
    back: "返回前一个页面",
    goBack: "返回",
    fillInfo: "填写信息",
    thanked: "已投，作者继续加油！",
    decline: "不了，返回",
};

/** 青蓝配色，与 galgame 主题一致 */
const C = {
    overlay: "rgba(2,10,20,0.78)",
    panel: "linear-gradient(180deg, rgba(9,26,42,0.97), rgba(6,18,30,0.98))",
    border: "rgba(56,189,248,0.35)",
    title: "#7dd3fc",
    text: "#cbd5e1",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.12)",
};

/**
 * 赞助面板总开关。
 *
 * 2026-11-15 打开：作者决定在《白米饭》结尾恢复「创作不易」支持面板。
 * ⚠ 与 TapTap 上架要求冲突：应用内不得出现赞助 / 打赏 / 付费引导，否则不予上架。
 * 如果之后还要走 TapTap 审核，这里必须改回 false；Steam 等允许赞助的渠道可以保持 true。
 */
const SUPPORT_ENABLED = true;

export function showSupportPanel(): Promise<void> {
    if (!SUPPORT_ENABLED) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        let page: SupportPage = "donate";
        let rail: SupportRail = "wechat";

        const root = document.createElement("div");
        root.style.cssText = [
            "position:fixed",
            "inset:0",
            "z-index:10001",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "background:" + C.overlay,
            "backdrop-filter:blur(4px)",
            "padding:16px",
            "font-family:inherit",
        ].join(";");

        const panel = document.createElement("div");
        panel.style.cssText = [
            "width:min(920px,100%)",
            "max-height:92vh",
            "overflow:auto",
            "background:" + C.panel,
            "border:1px solid " + C.border,
            "border-radius:14px",
            "padding:20px 22px",
            "display:flex",
            "flex-direction:column",
            "gap:14px",
            "box-shadow:0 24px 60px rgba(0,0,0,0.55)",
        ].join(";");

        const title = document.createElement("div");
        title.textContent = TEXT.title;
        title.style.cssText = [
            "text-align:center",
            "color:" + C.title,
            "font-size:19px",
            "letter-spacing:0.08em",
            "padding-bottom:10px",
            "border-bottom:1px solid " + C.border,
        ].join(";");

        // ── 中部：左竖排切换支付 · 中两张码 · 右翻页
        const middle = document.createElement("div");
        middle.style.cssText = "display:flex;gap:12px;align-items:stretch";

        const railCol = document.createElement("div");
        railCol.style.cssText = "display:flex;flex-direction:column;gap:8px;width:48px;flex:none";

        const railButtons: Record<SupportRail, HTMLButtonElement> = {
            wechat: makeRailButton(TEXT.wechat, () => {
                rail = "wechat";
                render();
            }),
            alipay: makeRailButton(TEXT.alipay, () => {
                rail = "alipay";
                render();
            }),
        };
        railCol.append(railButtons.wechat, railButtons.alipay);

        const plates = document.createElement("div");
        plates.style.cssText = "display:flex;gap:12px;flex:1;min-width:0";

        const plateA = makePlate();
        const plateB = makePlate();
        plates.append(plateA.root, plateB.root);

        const pageBtn = document.createElement("button");
        pageBtn.type = "button";
        pageBtn.style.cssText = [
            "width:48px",
            "flex:none",
            "border:1px solid " + C.border,
            "border-radius:8px",
            "background:" + C.accentSoft,
            "color:" + C.accent,
            "font-size:14px",
            "letter-spacing:0.2em",
            "cursor:pointer",
            "writing-mode:vertical-rl",
            "padding:10px 0",
        ].join(";");
        pageBtn.addEventListener("click", () => {
            page = page === "donate" ? "custom" : "donate";
            render();
        });

        middle.append(railCol, plates, pageBtn);

        // ── 底部两个按钮
        const footer = document.createElement("div");
        footer.style.cssText = "display:flex;gap:12px";

        const primary = document.createElement("button");
        primary.type = "button";
        primary.style.cssText = buttonStyle(true);
        primary.addEventListener("click", () => {
            // 定制页的「填写信息」打开留言表单；投币页直接结束
            if (page === "custom") {
                openLetterForm(() => close());
                return;
            }
            close();
        });

        const secondary = document.createElement("button");
        secondary.type = "button";
        secondary.style.cssText = buttonStyle(false);
        secondary.addEventListener("click", () => {
            if (page === "custom") {
                page = "donate";
                render();
                return;
            }
            close();
        });

        footer.append(primary, secondary);

        panel.append(title, middle, footer);
        root.appendChild(panel);
        document.body.appendChild(root);

        let done = false;
        function close() {
            if (done) {
                return;
            }
            done = true;
            root.remove();
            resolve();
        }

        function render() {
            railButtons.wechat.style.cssText = railStyle(rail === "wechat");
            railButtons.alipay.style.cssText = railStyle(rail === "alipay");

            const [srcA, srcB] = PLATES[page][rail];
            plateA.img.src = srcA;
            plateB.img.src = srcB;

            plateA.caption.textContent = page === "donate" ? TEXT.coinLine : TEXT.hundredLine;
            plateB.caption.textContent = page === "donate" ? TEXT.gachaLine : "\u00a0";

            pageBtn.textContent = page === "donate" ? TEXT.custom : TEXT.back;

            primary.textContent = page === "custom" ? TEXT.fillInfo : TEXT.thanked;
            secondary.textContent = page === "custom" ? TEXT.goBack : TEXT.decline;
        }

        render();
    });
}

function makeRailButton(label: string, onClick: () => void) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.cssText = railStyle(false);
    btn.addEventListener("click", onClick);
    return btn;
}

function railStyle(active: boolean) {
    return [
        "flex:1",
        "border:1px solid " + (active ? C.accent : "rgba(148,163,184,0.25)"),
        "border-radius:8px",
        "background:" + (active ? C.accentSoft : "rgba(15,32,48,0.7)"),
        "color:" + (active ? C.accent : "rgba(148,163,184,0.85)"),
        "font-size:14px",
        "letter-spacing:0.25em",
        "cursor:pointer",
        "writing-mode:vertical-rl",
        "padding:10px 0",
        "transition:all .18s ease",
    ].join(";");
}

function buttonStyle(primary: boolean) {
    return [
        "flex:1",
        "height:44px",
        "border-radius:8px",
        "font-size:15px",
        "font-weight:600",
        "letter-spacing:0.08em",
        "cursor:pointer",
        "transition:all .18s ease",
        primary
            ? "border:1px solid " + C.accent + ";background:" + C.accent + ";color:#04121f"
            : "border:1px solid " + C.border + ";background:transparent;color:" + C.text,
    ].join(";");
}

function makePlate() {
    const root = document.createElement("figure");
    root.style.cssText =
        "flex:1;min-width:0;margin:0;display:flex;flex-direction:column;align-items:center;gap:6px";

    const caption = document.createElement("figcaption");
    caption.style.cssText = [
        "color:" + C.accent,
        "font-size:13px",
        "letter-spacing:0.1em",
        "min-height:20px",
        "text-align:center",
    ].join(";");

    const img = document.createElement("img");
    img.alt = "";
    img.draggable = false;
    img.style.cssText = [
        "width:100%",
        "max-height:300px",
        "object-fit:contain",
        "border:1px solid " + C.border,
        "border-radius:8px",
        "background:#020a14",
    ].join(";");

    root.append(caption, img);
    return { root, caption, img };
}

/** relay 地址：服务器侧部署，2026-11-03 三条验证通过（含动态端口放行） */
const RELAY_URL = "https://mail.kuaiyingai.cloud";

/**
 * 玩家留言表单：填完 POST 到 relay，由 relay 转成 Gitee issue。
 * 字段上限与 relay 侧保持一致，避免玩家写完才被服务端拒。
 */
function openLetterForm(onClose: () => void) {
    const layer = document.createElement("div");
    layer.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:10002",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "background:" + C.overlay,
        "backdrop-filter:blur(6px)",
        "padding:16px",
        "font-family:inherit",
    ].join(";");

    const box = document.createElement("div");
    box.style.cssText = [
        "width:min(520px,100%)",
        "background:" + C.panel,
        "border:1px solid " + C.border,
        "border-radius:14px",
        "padding:22px",
        "display:flex",
        "flex-direction:column",
        "gap:12px",
        "box-shadow:0 24px 60px rgba(0,0,0,0.55)",
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "写给作者";
    title.style.cssText = [
        "color:" + C.title,
        "font-size:17px",
        "letter-spacing:0.08em",
        "text-align:center",
        "padding-bottom:4px",
    ].join(";");

    const handleInput = makeField("署名（可以不填）", 60);
    const replyInput = makeField("回信地址（可以不填）", 200);

    const area = document.createElement("textarea");
    area.placeholder = "想说什么都行。";
    area.rows = 5;
    area.maxLength = 4000;
    area.style.cssText = [fieldBase(), "resize:vertical", "min-height:110px"].join(";");

    const counter = document.createElement("div");
    counter.textContent = "0 / 4000";
    counter.style.cssText = "color:rgba(148,163,184,0.7);font-size:12px;text-align:right";
    area.addEventListener("input", () => {
        counter.textContent = area.value.length + " / 4000";
    });

    const footer = document.createElement("div");
    footer.style.cssText = "display:flex;gap:12px";

    const send = document.createElement("button");
    send.type = "button";
    send.textContent = "寄出去";
    send.style.cssText = buttonStyle(true);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "算了";
    cancel.style.cssText = buttonStyle(false);

    let done = false;
    const finish = () => {
        if (done) {
            return;
        }
        done = true;
        layer.remove();
        onClose();
    };

    cancel.addEventListener("click", finish);

    send.addEventListener("click", async () => {
        const message = area.value.trim();
        if (message.length < 2) {
            counter.textContent = "写点什么再寄吧。";
            counter.style.color = "#fda4af";
            return;
        }
        send.disabled = true;
        send.textContent = "寄出中…";
        try {
            const res = await fetch(RELAY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    handle: handleInput.value.trim(),
                    reply: replyInput.value.trim(),
                    message,
                }),
            });
            const data = (await res.json()) as { ok?: boolean };
            if (!data?.ok) {
                throw new Error("relay said no");
            }
            send.textContent = "寄出去了。这封信已经在他的收件箱里。";
            send.style.fontSize = "13px";
            setTimeout(finish, 1400);
        } catch {
            // relay 挂掉时不丢字：保留表单内容，让玩家可以重试
            send.disabled = false;
            send.textContent = "寄不出去，稍后再试";
        }
    });

    footer.append(send, cancel);
    box.append(title, handleInput, replyInput, area, counter, footer);
    layer.appendChild(box);
    document.body.appendChild(layer);
    area.focus();
}

function fieldBase() {
    return [
        "width:100%",
        "box-sizing:border-box",
        "border:1px solid " + C.border,
        "border-radius:8px",
        "background:rgba(2,10,20,0.6)",
        "color:" + C.text,
        "font-size:14px",
        "padding:10px 12px",
        "font-family:inherit",
        "outline:none",
    ].join(";");
}

function makeField(placeholder: string, maxLength: number) {
    const el = document.createElement("input");
    el.type = "text";
    el.placeholder = placeholder;
    el.maxLength = maxLength;
    el.style.cssText = fieldBase();
    return el;
}
