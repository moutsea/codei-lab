"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";

import Image from 'next/image';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type CodeBlockWithLineNumbersProps = {
  language: string;
  children: string | string[];
};

function useObjectUrl(input?: string | Blob) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!input) { setUrl(undefined); return; }
    if (typeof input === 'string') { setUrl(input); return; }
    const u = URL.createObjectURL(input);
    setUrl(u);
    return () => URL.revokeObjectURL(u); // 释放，防泄漏
  }, [input]);

  return url;
}

type MarkdownImgProps = {
  src?: string | Blob;
  alt?: string;
} & Omit<ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height' | 'fill'>;

export function MarkdownImg({ src, alt = '', className, style, ...rest }: MarkdownImgProps) {
  const url = useObjectUrl(src);
  if (!url) return null;

  return (
    <span className="my-6 flex justify-center">
      <Image
        src={url}
        alt={alt}
        width={1200}                 // 给比例/优化用；显示尺寸由 CSS 控制
        height={800}
        className={`rounded-lg shadow-md object-contain w-auto max-w-full ${className ?? ''}`}
        style={{ maxHeight: 600, ...style }}  // ✅ 等价于你原来的 maxHeight 方案
        sizes="100vw"
        // unoptimized               // 若外链域名未在 next.config.js 中配置，可先打开
        {...rest}
      />
    </span>
  );
}

function CodeBlockWithLineNumbers({ language, children }: CodeBlockWithLineNumbersProps) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");
  const lines = codeString.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="relative mb-4 ml-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors duration-200 z-10"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <div className="overflow-x-auto bg-gray-900 rounded-lg py-3">
        <table className="w-full">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="group hover:bg-gray-800">
                <td className="sticky left-0 w-12 text-right pr-4 pl-4 text-gray-500 text-sm select-none bg-gray-900 group-hover:bg-gray-800">
                  {index + 1}
                </td>
                <td className="text-left py-0">
                  <SyntaxHighlighter
                    style={{
                      ...oneDark,
                      'pre[class*="language-"]': {
                        ...oneDark['pre[class*="language-"]'],
                        background: 'transparent',
                        margin: 0,
                        padding: 0,
                        fontSize: '0.875rem',
                        lineHeight: '1.25rem'
                      },
                      'code[class*="language-"]': {
                        ...oneDark['code[class*="language-"]'],
                        background: 'transparent',
                        padding: 0
                      }
                    }}
                    language={language}
                    PreTag="pre"
                    className="m-0 p-0"
                  >
                    {line || ' '}
                  </SyntaxHighlighter>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const renderers = {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-8 text-foreground border-b border-border pb-6">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mb-6 pb-4 text-foreground border-b border-border pt-6 mt-8 first:border-t-0 first:pt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mb-4 text-foreground mt-6">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold mb-3 text-foreground mt-4">{children}</h4>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-7 text-foreground text-base">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 pl-8 list-disc space-y-2 text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 pl-8 list-decimal space-y-2 text-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mb-4 pl-6 ml-2 border-l-4 border-primary italic text-muted-foreground bg-primary/10 py-3 rounded-r-lg">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline transition-colors duration-200"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
    hr: () => <hr className="my-8 border-border" />,
    table: ({ children }) => (
      <div className="mb-4 overflow-x-auto ml-2">
        <table className="min-w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2">{children}</td>
    ),
    // img: ({ src, alt, ...props }) => (
    //   <span className="my-6 flex justify-center">
    //     <img
    //       src={src ?? ''}
    //       alt={alt || ''}
    //       className="rounded-lg shadow-md max-w-full h-auto object-contain"
    //       style={{ maxHeight: '600px', width: 'auto' }}
    //       {...props}
    //     />
    //   </span>
    // ),

    img: (props) => {
      const { src, alt, ...rest } = props;
      // react-markdown 的 src 类型是 string | undefined；如果你链路里可能出现 Blob，这里强转交由 MarkdownImg 处理
      return <MarkdownImg src={src as any} alt={alt ?? ''} {...rest} />;
    },
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const inline = !(className && match);
      return !inline && match ? (
        <CodeBlockWithLineNumbers language={match[1]}>
          {children as string | string[]}
        </CodeBlockWithLineNumbers>
      ) : (
        <code
          className={`${className ?? ''} bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400`}
          {...props}
        >
          {children}
        </code>
      );
    },
  } satisfies Components; // ← 关键：这里做类型校验+推断

  return (
    <div className={`max-w-none space-y-6 text-foreground pl-4 pr-4 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
