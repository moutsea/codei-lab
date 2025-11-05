// components/CodeBlock.tsx
import CopyButton from './copy-button';
import { highlightCode } from '@/lib/highlight';

export default async function CodeBlock({
    code,
    lang = 'bash',
    theme = 'github-dark'
}: {
    code: string;
    lang?: 'bash' | 'tsx' | 'js' | 'ts' | 'json';
    theme?: 'github-dark' | 'github-light';
}) {
    const html = await highlightCode(code, lang, theme);
    const cleanHtml = html.replace(/background-color:\s*[^;]+;/g, '');
    return (
        <div className="relative rounded-xl border border-white/10 bg-[#0f1115] p-3 text-sm shadow-md">
            {/* 可滚动 */}
            <div className="[&_*]:!font-mono [&_*]:!break-words whitespace-pre-wrap break-all min-w-0 ml-8">
                <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </div>

            <CopyButton text={code} />
        </div>
    );
}
