// lib/highlight.ts
import { codeToHtml } from 'shiki';

export async function highlightCode(
    code: string,
    lang: string = 'bash',
    theme: string = 'github-dark'
) {
    return await codeToHtml(code, {
        lang,
        theme
    });
}