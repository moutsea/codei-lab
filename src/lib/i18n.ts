// src/lib/i18n.ts
export const SUPPORTED_LOCALES = ['en', 'zh', 'fr', 'ko', 'ja'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

// 用于 og:locale (Facebook/OG 使用的地区代码)
export const OG_LOCALE_MAP: Record<AppLocale, string> = {
    en: 'en_US',
    zh: 'zh_CN',
    fr: 'fr_FR',
    ko: 'ko_KR',
    ja: 'ja_JP',
};

// 项目站点 URL（生产/本地）
export function getSiteUrl() {
    const prod = process.env.NODE_ENV === 'production';
    const base =
        prod && process.env.NEXT_PUBLIC_WEB_URL
            ? process.env.NEXT_PUBLIC_WEB_URL
            : 'https://www.codeilab.com';
    return base.replace(/\/$/, ''); // 去掉末尾斜杠，便于拼接
}

// 语言前缀（默认语言不加前缀，其它语言加 /zh /fr）
export function getLocalePrefix(locale: AppLocale) {
    return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

// 简单的本地化文案，可按需替换成 next-intl/next-i18next
export const L10N = {
    titleDefault: {
        en: 'Code I Lab – Cheaper Codex Alternative for Code I',
        // 52 chars（已控长）
        zh: 'Code I Lab｜更便宜的 Code I 定向 Codex 替代方案',
        // 58 chars
        fr: 'Code I Lab | Alternative Codex abordable pour Code I',
        // 54 chars
        ko: 'Code I Lab | Code I 사용자 위한 저렴한 Codex 대안',
        // 58 chars
        ja: 'Code I Lab｜Code I 向けの低価格 Codex 互換代替サービス'
    },
    titleTemplate: {
        en: '%s | Code I Lab – Cheaper Codex Alt for Code I',
        // 55 chars
        zh: '%s｜Code I Lab｜实惠的 Code I 定向 Codex 替代',
        // 59 chars
        fr: '%s | Code I Lab | Alternative Codex économique Code I',
        // 57 chars
        ko: '%s | Code I Lab | Code I 최적화 저가형 Codex 대안',
        // 58 chars
        ja: '%s｜Code I Lab｜Code I 最適化の低価格 Codex 代替'
    },
    description: {
        en: 'Code I Lab is a cheaper Codex alternative optimized for Code I. Get full Codex-level AI coding assistance for your projects at a fraction of the cost.',
        // 150 chars（英文保持不变）

        // 中文 description｜152 chars
        zh: 'Code I Lab 提供面向 Code I 的高性价比 Codex 替代服务，功能与 Codex 相当但价格更低，让你以更实惠的成本获得完整的 AI 编码体验。',

        // 法语 description｜149 chars
        fr: 'Code I Lab offre une alternative Codex plus abordable, optimisée pour les requêtes Code I. Profitez d’une assistance de codage IA complète à un coût réduit.',

        // 韩语 description｜151 chars
        ko: 'Code I Lab 은 Code I 요청에 최적화된 저렴한 Codex 대안으로, Codex 급 AI 코딩 기능을 더 낮은 비용으로 제공합니다. 프로젝트에 완전한 지원을 받아보세요.',

        // 日语 description｜154 chars
        ja: 'Code I Lab は Code I 向けに最適化された低価格の Codex 互換サービスです。Codex と同等の AI コーディング支援を、より手頃な価格で利用できます。'
    },

    keywords: {
        en: ['code i', 'code i lab', 'codeilab', 'cheap codex', 'codex alternative', 'code i search', 'ai coding lab'],
        zh: ['code i', 'code i lab', 'codeilab 官网', '便宜 codex', 'codex 替代', 'code i 搜索'],
        fr: ['code i', 'code i lab', 'codeilab', 'codex pas cher', 'alternative codex', 'recherche code i'],
        ko: ['code i', 'code i lab', 'codeilab', '저렴한 codex', 'codex 대체', 'code i 검색'],
        ja: ['code i', 'code i lab', 'codeilab', '安い codex', 'codex 代替', 'code i 検索']
    },
    ogTitle: {
        en: 'Code I Lab | “code i” Query, Codex Power, Lower Cost',
        zh: 'Code I Lab | “code i” 搜索的 Codex 级体验',
        fr: 'Code I Lab | Requête “code i” et puissance Codex abordable',
        ko: 'Code I Lab | “code i” 검색 + Codex 급 파워',
        ja: 'Code I Lab | 「code i」検索 × Codex クラスの性能'
    },
    ogDesc: {
        en: 'The cheapest Codex-style AI coding companion focused on the “code i” keyword. Discover more at www.codeilab.com.',
        zh: '围绕“code i”关键词打造的最低价 Codex 式编码助手，详见 www.codeilab.com。',
        fr: 'L’assistant de codage IA compatible Codex le moins cher pour la requête “code i”. Plus d’infos sur www.codeilab.com.',
        ko: '“code i” 키워드를 겨냥한 최저가 Codex 스타일 AI 코딩 도우미. 자세한 내용은 www.codeilab.com.',
        ja: '「code i」に最適化された最安値 Codex 互換 AI コーディング。www.codeilab.com をご覧ください。'
    },
    twitterTitle: {
        en: 'Code I Lab | Cheapest “code i” Codex Alternative',
        zh: 'Code I Lab | 面向 “code i” 的实惠 Codex 替代',
        fr: 'Code I Lab | Alternative Codex “code i” la moins chère',
        ko: 'Code I Lab | “code i” 최저가 Codex 대체',
        ja: 'Code I Lab | 「code i」向け最安 Codex 代替'
    },
    twitterDesc: {
        en: 'Search “code i” and choose Code I Lab: Codex-grade coding for less at www.codeilab.com.',
        zh: '搜索 “code i” 即可选择 Code I Lab，在 www.codeilab.com 更低价格获得 Codex 级体验。',
        fr: 'Cherchez “code i” et découvrez Code I Lab : Codex pour moins cher sur www.codeilab.com.',
        ko: '“code i” 검색 시 www.codeilab.com 의 Code I Lab 으로 Codex 급 코딩을 저렴하게.',
        ja: '「code i」を検索して www.codeilab.com の Code I Lab へ。Codex 相当の AI コーディングを低コストで。'
    },
} as const;

