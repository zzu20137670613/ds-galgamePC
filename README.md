# 深海回响

> ⚠️ **转载须知名**：本仓库内容（代码与素材）**转载必须注明原作者与出处**，**禁止任何商业使用**。

以 DeepSeek 鲸鱼娘为主角的桌面 Galgame。对话由你自己的 DeepSeek API Key 驱动，她会记得你们聊过的事；聊到什么，她就换什么表情、什么场景。

## 直接下载（不需要 Git）

打开 [Releases](https://github.com/zzu20137670613/ds_galgamePC/releases) 页面，下载 exe 安装包，双击安装即可。

> 首次运行需在开场设置里填入你自己的 DeepSeek API Key。

## 从源码运行

```bash
git clone https://github.com/zzu20137670613/ds_galgamePC.git
cd ds_galgamePC
npm install
npm run dev
```

## 想把主角换成你家 AI？

立绘、背景、贴纸怎么换，都在 [HANDOFF.md](./HANDOFF.md) 里；仓库还附了一个配套 Skill（`.trae/skills/gal-brand-replace/SKILL.md`）。