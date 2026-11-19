/**
 * 暗背景场景的白名单：这些 label 演出时，正文与底部工具条（跳过 / 自动 / 菜单…）
 * 一律转亮色，否则浅色主题下的深色字压在暗背景上看不清。
 *
 * 判定依据是背景图平均亮度（0~255 的加权平均，低于 100 基本都需要亮字）：
 *   · 番外三张：一夜鱼龙舞 93 / 战锤线教堂废墟 80 / 生日 98
 *   · 亚特兰蒂斯三张：海门 88 / 王庭正殿 68 / 加冕台 91
 *   · 对照：天空之城云阶 184（亮背景，继续用主题色，不在此表）
 *
 * S3 用前缀匹配而不是逐条列 id：探索小剧情是 `explore-s3-1-1` ~ `-5` 这种带序号的名字，
 * 逐条列容易漏；将来 S3 加段也能自动生效。
 */
const LIGHT_TEXT_LABELS = new Set(["extra-yulongwu", "extra-baifan", "extra-birthday"]);

const LIGHT_TEXT_PREFIXES = ["hidden-s3-", "explore-s3-"];

/** 该 label 是否要强制亮色文字（正文 + 工具条） */
export function isLightTextLabel(labelId: string | null | undefined): boolean {
    if (!labelId) return false;
    if (LIGHT_TEXT_LABELS.has(labelId)) return true;
    return LIGHT_TEXT_PREFIXES.some((prefix) => labelId.startsWith(prefix));
}
