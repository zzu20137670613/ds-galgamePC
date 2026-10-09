---
name: "gal-brand-replace"
description: "给深海回响 Galgame 换品牌主题（立绘/背景/贴纸/默认角色名/窗口标题），默认 DeepSeek 鲸鱼娘，支持任意 AI 品牌。用户说'换立绘/换背景/换贴纸/换主题/换品牌/换成GPT/换成Claude/换成Kimi/换成千问/换成豆包'时触发。"
---

# Galgame 品牌换肤 Skill

## 一句话总结

把深海回响 Galgame（当前主角：DeepSeek 鲸鱼娘）改成**任意 AI 品牌**的定制版。三件事：换图、改索引、改名字。其他细节留给下一任用户和她的 AI 一起慢慢调。

## 触发场景

- "帮我换成 GPT / Claude / Kimi / 千问 / 豆包 的版本"
- "把立绘/背景/贴纸换成 XX 的"
- "给这个 galgame 换个品牌主题"

## 三步换肤

### 第一步：换图（替换图片文件）

把新角色的图片放到对应目录，**文件名建议沿用 `{表情}_{角色名}_{场景描述}.{ext}` 格式**（方便后续维护，但不强制）。

| 素材类型 | 目录 | 当前文件数 | 说明 |
|---------|------|-----------|------|
| **立绘** | `public/立绘/` | ~100+ 张 | 聊天界面右侧大图，角色立绘 |
| **背景** | `public/背景/` + `public/场景/` | ~20 张 | 聊天背景和场景背景 |
| **贴纸** | `public/贴纸/` | ~50 张 | 对话中弹出的 Q 版表情贴纸 |

操作：删掉旧图 → 放入新图。**旧图文件名记下来，下一步要用。**

### 第二步：改索引（更新 material-index.ts）

这是核心文件：`src/lib/materials/material-index.ts`

里面有一个 `MATERIAL_INDEX` 数组，每个条目长这样：

```typescript
{
    kind: "character",  // "character"=立绘 / "background"=背景 / "sticker"=贴纸
    src: "/立绘/开心_鲸鱼娘_V手势立绘.jpg",  // ← 改成新图片路径
    triggers: ["耶", "胜利", "V手势"],        // ← 改成新角色的触发词
    tags: ["立绘"],
}
```

**需要改的内容：**
- `src` → 指向新图片路径（对应第一步放的文件）
- `triggers` → 换成新角色会触发的关键词（比如 GPT 娘可能触发"推理""算力"，Claude 娘可能触发"诗意""温柔"）
- 文件名里的 `鲸鱼娘` → 换成新角色名（全局搜索替换就行）

**两种做法，任选一种：**

A. **懒人法**：全局搜索替换 `鲸鱼娘` → 新角色名，然后手动调整触发词
B. **精细法**：逐条改 `src`、`triggers`，想怎么配怎么配

> 改完记得跑一下 `npm run dev`，控制台如果有 `[material-index] 触发词互斥违规` 警告就说明有重复触发词，改掉就行。

### 第三步：改名字（品牌字符串）

改这几个文件里的默认名字和标题：

| 文件 | 改什么 | 当前值 |
|------|--------|--------|
| `electron/main.mjs` 第 31 行附近 | 窗口标题 | `深海回响` |
| `index.html` | `<title>` | `深海回响` |
| `src/locales/zh.json` | 默认角色名相关文案 | `鲸鲸` / `deepseek-chat` |
| `src/content/characters.ts` 第 11 行 | 默认角色名 | `鲸鲸` |
| `package.json` | `productName` | `深海回响` |
| `vite.config.ts` | PWA 名称 | `深海回响` |

**还需要改图标：**
- `public/icon.png` — 网页图标
- `build/icon.png` — exe 图标

---

## 改完之后

```bash
npm install
npm run build
```

安装包在 `release/` 目录下，一个 exe，发给用户就行。

---

## 注意

- `public/characters/` 和 `public/assets/whale/` 里是鲸鲸小部件的图，跟主素材无关，可以顺手换也可以先不管
- `src/lib/archive/finale.ts` 里有终局结局逻辑，新建的角色如果没设计结局可以先不碰
- 素材冲突检查是自动的，dev 模式下控制台会报