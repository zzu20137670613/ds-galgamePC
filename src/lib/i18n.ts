import i18n, { type ReadCallback } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import { initReactI18next } from "react-i18next";

class Backend extends ChainedBackend {
    override async read(lng: string, ns: string, callback: ReadCallback) {
        try {
            const object = await getLocalesResource(lng);
            const result = object[ns];
            callback(null, result);
        } catch (error) {
            callback(error as Error, { data: null });
        }
    }
}

export const useI18n = async () => {
    if (!i18n.isInitialized) {
        await i18n
            .use(Backend)
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                debug: false,
                // 本游戏为中文 Galgame，默认语言固定为中文；
                // localStorage 可能出现旧缓存（如 en），此处显式指定 lng 覆盖之。
                lng: "zh",
                fallbackLng: "zh",
                supportedLngs: ["zh", "en"],
                interpolation: {
                    escapeValue: false,
                },
                load: "currentOnly",
                detection: {
                    order: ["localStorage"],
                    caches: ["localStorage"],
                },
                missingInterpolationHandler(_text, value, _options) {
                    return value[1];
                },
            });
        // 兜底：无论 localStorage 残留了什么语言缓存，都强制回到中文，
        // 并覆写缓存，避免下次启动再次被旧值带偏。
        await i18n.changeLanguage("zh");
        try {
            localStorage.setItem("i18nextLng", "zh");
        } catch {
            // ignore
        }
    }
};

function getLocalesResource(lng: string): Promise<Record<string, Record<string, string>>> {
    return import(`./../locales/${lng}.json`);
}

export async function downloadResourceToTranslate() {
    const lng = i18n.options.fallbackLng?.toString() || "en";
    const data = await getLocalesResource(lng);
    const jsonString = JSON.stringify(data);
    // download the save data as a JSON file
    const blob = new Blob([jsonString], { type: "application/json" });
    // download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strings_${lng}.json`;
    a.click();
}
