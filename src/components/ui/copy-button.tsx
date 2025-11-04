'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react'; // 可选
// 你也可以换成自己的 SVG

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
    }

    return (
        <button
            onClick={onCopy}
            aria-label="Copy code"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md  bg-transparent hover:bg-white/10 text-white hover:text-white transition"
            title={copied ? 'Copied!' : 'Copy'}
        >
            {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
    );
}
