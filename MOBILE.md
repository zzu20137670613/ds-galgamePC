# 移动端适配规约

> 生效起始：v0.2.0。几个版本迭代（含触发式隐藏剧情）后转入移动化（优先 PWA，Capacitor 备选）。
> 从现在起，**每次新增/修改代码都按下述约束执行**，避免移动端返工。

## 1. 平台能力隔离（核心）
- 主进程能力（`electron/main.mjs`、`preload.cjs`、`window.whale*`）只属于桌面端，移动端没有。
- 页面层一律走统一抽象：`context-archive`（存档/记忆）、`chat-api`（API）。这两个模块已是「Electron 实现 + IndexedDB/Web fallback」双轨（`resolveArchiveBackend` 自动切换）——**新增任何能力都要按这个模式提供双轨**，让移动端自动落到 Web 实现。
- 不要在组件里直接 `require`/`import` node 模块或访问 `window.whaleArchive`，一律经 `isElectronDesktop()` 判定的抽象层。

## 2. 存储
- 移动端无文件系统：所有持久化必须能用 **IndexedDB / localStorage** 表达（现状已满足）。
- API key 等敏感信息继续走 `SetupStore`（localStorage），不写死在代码。
- `conversation.md/.txt` 镜像仅桌面端生成（主进程写文件），移动端不得依赖它。

## 3. 交互 / 事件
- 触控优先：关键交互用 **pointer 事件 / 原生 HTML 控件**，不依赖 mouse 独有行为（滚轮、hover、右键）。
- 不在 canvas 层承载关键交互（移动端 canvas 命中策略与桌面不同）。
- 输入框必须可聚焦：沿用聊天页 `pointer-events-auto` 模式——在可交互容器上显式开启命中。

## 4. 布局 / 视口
- 不用绝对像素布局承载关键 UI，使用弹性布局（当前 chat 三态布局即弹性版式）。
- 移动端处理刘海屏：预留 `viewport-fit=cover` + `safe-area-inset` 适配点，需要时补充 CSS 变量。
- 图标/图片资源已存在 public/（PWA 图标齐全），可直接复用。

## 5. 音频
- 移动端自动播放受限：音频/解锁逻辑必须在用户首次交互后触发（Tone.js 场景同理）。

## 6. 网络
- API 请求保留双路径：桌面走 Electron 主进程转发，浏览器/移动端走 `fetch` + CORS 代理（`chat-api.ts` 现状），新增请求同样处理。

## 7. 形态
- PWA 已是 `generateSW` 就绪、manifest/icon 齐备 → 移动化首选 PWA 包壳上线。
- 后续需要原生能力（推送、相机等）再评估 Capacitor。