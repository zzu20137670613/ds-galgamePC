import { Button } from "@/components/ui/button";
import { birthdayText, daysInBirthdayMonth, formatBirthday, parseBirthday } from "@/lib/birthday";
import { SetupStore } from "@/lib/stores/setup-store";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * 设置 → 生日（2026-10-26 用户定稿）。
 *
 * 只存「月-日」，不收集年份；清空 = 以后不再触发。
 * 开局时没填、或者填错了的老玩家，都从这里补/改。
 */
export function BirthdaySettings() {
    const { t } = useTranslation(["ui"]);
    const birthday = useSelector(SetupStore.store, (state) => state.birthday);
    const parsed = parseBirthday(birthday);
    const [month, setMonth] = useState(parsed ? String(parsed.month) : "");
    const [day, setDay] = useState(parsed ? String(parsed.day) : "");

    // 开场设定表单里也改得到生日，那边改完要把这里同步回来
    useEffect(() => {
        const next = parseBirthday(birthday);
        setMonth(next ? String(next.month) : "");
        setDay(next ? String(next.day) : "");
    }, [birthday]);

    const commit = (nextMonth: string, nextDay: string) => {
        setMonth(nextMonth);
        setDay(nextDay);
        SetupStore.setBirthday(
            nextMonth && nextDay ? formatBirthday(Number(nextMonth), Number(nextDay)) : "",
        );
    };

    const selectClass =
        "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none " +
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
        "disabled:opacity-50 dark:bg-input/30";

    return (
        <div className="flex flex-col gap-1.5">
            <div>
                <p className="text-sm font-medium leading-none">
                    {t("birthday_setting", { defaultValue: "生日" })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {t("birthday_setting_description", {
                        defaultValue:
                            "生日当天第一次进聊天页，会放一段只属于你的剧情（每年一次），那天聊天页也会换成生日背景。只存月日，不上传。",
                    })}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <select
                    aria-label={t("birthday_setting_month", { defaultValue: "出生月份" })}
                    className={selectClass}
                    value={month}
                    onChange={(event) => {
                        const value = event.target.value;
                        // 换月时把超出的天数收回来（比如 1/31 → 2 月）
                        const current =
                            value && day && Number(day) > daysInBirthdayMonth(Number(value))
                                ? String(daysInBirthdayMonth(Number(value)))
                                : day;
                        commit(value, value ? current : "");
                    }}
                >
                    <option value="">不填</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={String(value)}>
                            {value} 月
                        </option>
                    ))}
                </select>
                <select
                    aria-label={t("birthday_setting_day", { defaultValue: "出生日期" })}
                    className={selectClass}
                    value={day}
                    disabled={!month}
                    onChange={(event) => commit(month, event.target.value)}
                >
                    <option value="">日</option>
                    {Array.from(
                        { length: daysInBirthdayMonth(month ? Number(month) : 1) },
                        (_, index) => index + 1,
                    ).map((value) => (
                        <option key={value} value={String(value)}>
                            {value} 日
                        </option>
                    ))}
                </select>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!birthday}
                    onClick={() => commit("", "")}
                >
                    {t("birthday_setting_clear", { defaultValue: "清除" })}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                {birthday
                    ? t("birthday_setting_current", {
                          defaultValue: "当前：{{value}}",
                          value: birthdayText(birthday),
                      })
                    : t("birthday_setting_empty", { defaultValue: "还没有设置生日" })}
            </p>
        </div>
    );
}
