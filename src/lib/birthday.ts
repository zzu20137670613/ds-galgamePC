/**
 * 生日（2026-10-26 与用户定稿）。
 *
 * 规则：
 *  - 只存「月-日」（"MM-DD"），**不收集年份**，不涉及年龄；
 *  - 2 月 29 日出生的人在平年按 2 月 28 日算；
 *  - 生日当天「每次进聊天页」判定一次，每年只放一次剧情；
 *  - 已放过的年份记成数组（不是单个年份），改系统时间最多同年多刷一次 —— 没有服务器就防不住，接受；
 *  - 手机端与 PC 端存档各自独立，所以两端各填一次、各触发一次。
 */
import { SetupStore } from "@/lib/stores/setup-store";

/** 生日剧情 label id（见 content/labels/extra-birthday.label.ts） */
export const BIRTHDAY_LABEL_ID = "extra-birthday";

/**
 * 生日当天的聊天页默认背景。
 * 用的是生日剧情最后一幕的全家福（2026-10-27 用户供图，6 人版），一张图两用。
 */
export const BIRTHDAY_BACKGROUND_SRC = "/场景/生日6_全家福.jpg";

/** 平时的聊天页默认背景（与改动前保持一致） */
export const DEFAULT_CHAT_BACKGROUND = "/背景/海滩假日_鲸鱼娘.png";

/** 已放过的生日剧情年份（JSON 数组） */
const LS_STORY_SHOWN = "gal_birthday_shown";
/** 已让 API 说过生日快乐的年份（JSON 数组） */
const LS_GREETED = "gal_birthday_greeted";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 某个月最多几天（2 月按闰年给 29，方便下拉框把 2/29 也列出来） */
export function daysInBirthdayMonth(month: number): number {
    return DAYS_IN_MONTH[month - 1] ?? 31;
}

export function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

/** 月/日 → 存储格式 "MM-DD"；任一为空返回空串 = 未设置 */
export function formatBirthday(month: number, day: number): string {
    if (!month || !day) return "";
    return `${pad2(month)}-${pad2(day)}`;
}

export function parseBirthday(value: string): { month: number; day: number } | null {
    const matched = /^(\d{1,2})-(\d{1,2})$/.exec(String(value ?? "").trim());
    if (!matched) return null;
    const month = Number(matched[1]);
    const day = Number(matched[2]);
    if (month < 1 || month > 12 || day < 1 || day > daysInBirthdayMonth(month)) return null;
    return { month, day };
}

/** 给界面看的文案："3 月 17 日"；未设置返回空串 */
export function birthdayText(value: string): string {
    const parsed = parseBirthday(value);
    return parsed ? `${parsed.month} 月 ${parsed.day} 日` : "";
}

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 今天是不是生日：2/29 出生的人在平年按 2/28 算 */
export function isBirthdayToday(birthday: string, now: Date = new Date()): boolean {
    const parsed = parseBirthday(birthday);
    if (!parsed) return false;
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (parsed.month === 2 && parsed.day === 29) {
        return month === 2 && day === (isLeapYear(now.getFullYear()) ? 29 : 28);
    }
    return month === parsed.month && day === parsed.day;
}

function readYears(key: string): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map((year) => String(year)) : [];
    } catch {
        return [];
    }
}

function rememberYear(key: string, year: number): void {
    if (typeof localStorage === "undefined") return;
    try {
        const years = readYears(key);
        const value = String(year);
        if (years.includes(value)) return;
        years.push(value);
        localStorage.setItem(key, JSON.stringify(years));
    } catch {
        // 写不进去（隐私模式 / 配额满）时最多变成"下次再放一次"，不影响主流程
    }
}

/** 今天该不该放生日剧情：生日当天 + 今年还没放过 */
export function shouldTriggerBirthdayStory(now: Date = new Date()): boolean {
    if (!isBirthdayToday(SetupStore.store.state.birthday, now)) return false;
    return !readYears(LS_STORY_SHOWN).includes(String(now.getFullYear()));
}

/** 进入剧情前先记账，避免演出中刷新导致重复触发 */
export function markBirthdayStoryShown(now: Date = new Date()): void {
    rememberYear(LS_STORY_SHOWN, now.getFullYear());
}

/** 生日当天的第一句话：该不该让 API 主动说生日快乐（每年一次） */
export function shouldGreetBirthday(now: Date = new Date()): boolean {
    if (!isBirthdayToday(SetupStore.store.state.birthday, now)) return false;
    return !readYears(LS_GREETED).includes(String(now.getFullYear()));
}

export function markBirthdayGreeted(now: Date = new Date()): void {
    rememberYear(LS_GREETED, now.getFullYear());
}

/**
 * 生日问候的隐藏提示词。
 * 只在这一次请求里拼进 system，**不写进聊天存档**，所以第二天翻记录看不到"系统让她说的"。
 */
export function buildBirthdayGreetHint(playerName: string, whaleName: string): string {
    const name = playerName.trim() || "主人";
    const self = whaleName.trim() || "鲸鲸";
    return [
        `【今天是特殊的一天】今天是${name}的生日。`,
        `这是你们今天说的第一句话：请在这次回复的开头，用${self}自己的口吻主动对${name}说一声生日快乐，然后再自然接住对方刚才说的话。`,
        '不要提到"系统提醒""设定"之类的事，也不要说"是你告诉我的"。',
    ].join("\n");
}
