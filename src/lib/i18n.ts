// src/lib/i18n.ts
export const SUPPORTED_LOCALES = ['en', 'zh', 'fr'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

// 用于 og:locale (Facebook/OG 使用的地区代码)
export const OG_LOCALE_MAP: Record<AppLocale, string> = {
    en: 'en_US',
    zh: 'zh_CN',
    fr: 'fr_FR',
};

// 项目站点 URL（生产/本地）
export function getSiteUrl() {
    const prod = process.env.NODE_ENV === 'production';
    const base =
        prod && process.env.NEXT_PUBLIC_WEB_URL
            ? process.env.NEXT_PUBLIC_WEB_URL
            : 'https://www.claudeide.net';
    return base.replace(/\/$/, ''); // 去掉末尾斜杠，便于拼接
}

// 语言前缀（默认语言不加前缀，其它语言加 /zh /fr）
export function getLocalePrefix(locale: AppLocale) {
    return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

// 简单的本地化文案，可按需替换成 next-intl/next-i18next
export const L10N = {
    titleDefault: {
        en: 'Claude ide | Affordable AI Coding in Your IDE',
        zh: 'Claude ide | 实惠高效的 IDE 内置 AI 编码',
        fr: 'Claude ide | IA abordable de codage dans votre IDE',
    },
    titleTemplate: {
        // `%s | ...`
        en: '%s | Claude ide | Affordable AI Coding in Your IDE',
        zh: '%s | Claude ide | 实惠高效的 IDE 内置 AI 编码',
        fr: '%s | Claude ide | IA abordable de codage dans votre IDE',
    },
    description: {
        en: "Claude ide offers a powerful AI coding assistant, providing all the features of Claude Code, but at a more affordable price. Perfect for developers looking for smart, efficient coding support.",
        zh: "Claude ide 提供强大的 AI 编码助手，具备与 Claude Code 相当的功能，但价格更实惠；适合追求高效与聪明辅助的开发者。",
        fr: "Claude ide offre un assistant de codage IA puissant, fournissant les fonctionnalités de Claude Code à un prix plus abordable. Parfait pour les développeurs.",
    },
    keywords: {
        en: [
            'claude ide', 'ai coding assistant', 'affordable ai coding', 'coding ai', 'programming assistant',
            'intelligent coding', 'claude code alternative', 'developer productivity', 'ai tools for developers', 'coding support'
        ],
        zh: [
            'claude ide', 'AI 编码助手', '实惠 AI 编码', '代码 AI', '编程助手',
            '智能编码', 'Claude Code 替代', '开发者效率', '开发者 AI 工具', '编码支持'
        ],
        fr: [
            'claude ide', 'assistant IA de codage', 'codage IA abordable', 'IA de codage', 'assistant de programmation',
            'codage intelligent', 'alternative à Claude Code', 'productivité développeur', 'outils IA pour développeurs', 'support de codage'
        ],
    },
    ogTitle: {
        en: 'Claude ide | Affordable AI Coding Assistance',
        zh: 'Claude ide | 实惠的 AI 编码助理',
        fr: 'Claude ide | Assistance IA de codage abordable',
    },
    ogDesc: {
        en: 'Claude ide offers an AI-powered coding assistant like Claude Code, but at a fraction of the price. Perfect for developers.',
        zh: 'Claude ide 提供与 Claude Code 类似的 AI 编码助手，但价格更亲民；非常适合开发者。',
        fr: "Claude ide propose un assistant de codage alimenté par l'IA, similaire à Claude Code, mais à moindre coût. Parfait pour les développeurs.",
    },
    twitterTitle: {
        en: 'Claude ide | Affordable AI Coding Assistance',
        zh: 'Claude ide | 实惠的 AI 编码助理',
        fr: 'Claude ide | Assistance IA de codage abordable',
    },
    twitterDesc: {
        en: 'Get affordable AI-powered coding assistance with Claude ide, the smarter alternative to Claude Code.',
        zh: '使用 Claude ide 获取实惠的 AI 编码助理，是 Claude Code 更聪明的替代方案。',
        fr: "Obtenez une assistance de codage IA abordable avec Claude ide, une alternative plus intelligente à Claude Code.",
    },
} as const;
