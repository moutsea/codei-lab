import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    experimental: {
        mdxRs: true,
    },
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    outputFileTracingRoot: process.cwd(),
    // async headers() {
    //     return [
    //         {
    //             source: '/(.*)',  // 针对所有页面
    //             headers: [
    //                 {
    //                     key: 'Content-Security-Policy',
    //                     value: "font-src 'self' https://applepay.cdn-apple.com https://m.stripe.network https://js.stripe.com https://fonts.gstatic.com data: http://at.alicdn.com;",
    //                 },
    //             ],
    //         },
    //     ];
    // },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);