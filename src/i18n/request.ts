import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
export const locales = ['en', 'zh', 'fr'] as const;


export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as typeof locales[number])) {
        locale = routing.defaultLocale;
    }

    if (!routing.locales.includes(locale as typeof locales[number])) {
        locale = "en";
    }

    try {
        const messages = (await import(`./messages/${locale.toLowerCase()}.json`))
            .default;
        return {
            locale: locale,
            messages: messages,
        };
    } catch (error) {
        console.error('Failed to load locale messages:', error);
        return {
            locale: "en",
            messages: (await import(`./messages/en.json`)).default,
        };
    }
});
