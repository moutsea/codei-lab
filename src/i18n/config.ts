import { Pathnames } from 'next-intl/routing';
export const locales = ['en', 'zh', 'fr'] as const;
export const defaultLocale = 'en';

// Pathnames configuration removed - using automatic routing with localePrefix: 'as-needed'

// Use 'as-needed' to hide locale prefix for default locale (English)
export const localePrefix = 'as-needed';

export const localeNames: Record<string, string> = {
    en: "English",
    zh: "中文",
    fr: "Français"
};


export const pathnames = {
    '/': '/',
    '/zh': '/zh',
    '/fr': '/fr',
    "/dashboard": "/dashboard",
    "/docs": "/docs",
    "/docs/[category]/[slug]": "/docs/[category]/[slug]",
    // "/zh/dashboard": "/zh/dashboard"
} satisfies Pathnames<typeof locales>;

// Type definitions for app pathnames removed with pathnames configuration

export const getLanguageByLang = (lang: string) => {
    const languages = [
        { code: "en-US", lang: "en", language: "English", languageInChineseSimple: "英语" },
        { code: "zh-CN", lang: "zh", language: "简体中文", languageInChineseSimple: "简体中文" },
        { code: "fr-FR", lang: "fr", language: "Français", languageInChineseSimple: "法语" }
    ];

    for (let i = 0; i < languages.length; i++) {
        if (lang === languages[i].lang) {
            return languages[i];
        }
    }
    return languages[0];
};
