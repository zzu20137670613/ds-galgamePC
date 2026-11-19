> **代码已迁移至 Gitee**
>
> 本仓库的代码不再更新。后续所有代码更新请看 Gitee：
> https://gitee.com/zzu20137670613/ds-galgamePC
>
> 本 GitHub 仓库仅用于发布最新安装包（Releases）。

---

<!-- 作品站下载指向 -->
> **📥 只想玩，不想折腾源码？**
> 到作品站可以直接下载 **Windows EXE 安装包**：<https://api.kuaiyingai.cloud/download/#gal>

---

# 深海回响·鲸鲸

> **许可**：代码使用 [PolyForm Noncommercial 1.0.0](./LICENSE)，CG / 剧情 / 音乐等创作内容使用 [CC BY-NC-SA 4.0](./CONTENT-LICENSE.md)。
> 可以自由阅读、编译、游玩、修改、非商业分享；**不得用于任何商业目的**。直播、录屏、同人创作不受限制。

以 DeepSeek 鲸鱼娘为主角的桌面 Galgame。对话由你自己的 DeepSeek API Key 驱动，她会记得你们聊过的事；聊到什么，她就换什么表情、什么场景。

## 直接下载（不需要 Git）

打开[作品站](https://api.kuaiyingai.cloud/download/)，选「深海回响·鲸鲸」下载对应平台的安装包。

> 首次运行可以直接以**游客模式**进入：剧情、隐藏线、番外、小游戏都能玩；想让她实时对话，在设置里补上你自己的 DeepSeek API Key 即可。

## 从源码运行

```bash
git clone https://gitee.com/zzu20137670613/ds-galgamePC.git
cd ds-galgamePC
npm install
npm run dev
```

## 想把主角换成你家 AI？

立绘、背景、贴纸怎么换，都在 [HANDOFF.md](./HANDOFF.md) 里；仓库还附了一个配套 Skill（`.trae/skills/gal-brand-replace/SKILL.md`）。

## 许可

- **代码**：[PolyForm Noncommercial 1.0.0](./LICENSE) —— 源码可见，但**不是开源许可**，禁止商业使用
- **创作内容**（立绘 / CG / 剧情 / 音乐）：[CC BY-NC-SA 4.0](./CONTENT-LICENSE.md)
- **直播、录屏、同人作品**：允许，**含平台广告分成**，无需单独授权

> **版本分界**：v1.5.0 之前的版本以 GPL-3.0 发布，那些版本仍然适用 GPL-3.0；自 v1.5.0 起适用上述许可。
>
> 本作**免费发布**，通过[作品站](https://api.kuaiyingai.cloud/download/)分发，不设付费版本。