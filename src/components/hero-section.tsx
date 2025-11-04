import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/ui/codeblock";
import { ArrowRight, Zap } from "lucide-react";

const InstallNodeDiv = () => {
    const t = useTranslations();
    return (
        <div>
            <p>
                {t('hero.installNodeJs')}{' '} <Link href="https://nodejs.org/" target="_blank" className="text-slate-500 underline">Node.js 18+</Link>, {t('hero.thenRun')}:
            </p>
        </div>
    );
}

export default function HeroSection() {
    const t = useTranslations();
    const locale = useLocale();
    const codeSnippet = `npm install -g @anthropic-ai/claude-code`;

    return (
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                    {t("hero.title")}
                </h1>

                <div className="w-full items-center">
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed mt-12">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex justify-center gap-6">

                        <Button variant="black" size="lg" className="text-lg px-8 py-4 h-12 rounded-2xl mr-6" asChild>
                            <Link href={`/${locale}/docs`}>
                                {t("hero.cta")} <Zap />
                            </Link>
                        </Button>

                        <Button
                            variant="link"
                            size="lg"
                            className="text-lg px-8 py-4 h-12 rounded-2xl mr-6" asChild
                        >
                            <Link href={`/${locale}/#pricing`}>
                                {t('pricingModal.upgrade')} <ArrowRight />
                            </Link>
                        </Button>

                    </div>

                    <div className="flex sm:flex-row gap-4 justify-center items-center mb-24 mt-6">
                        <div className='flex justify-start mt-6'>
                            <Image
                                className='h-12 w-12 my-auto object-cover rounded-full ring-0 ring-gray-500'
                                src="/user_1.jpg"
                                alt="Happy user 1"
                                width={48}
                                height={48}
                            />
                            <Image
                                className='h-12 w-12 my-auto object-cover rounded-full ring-0 ring-gray-500 -ml-2'
                                src="/user_2.jpg"
                                alt="Happy user 2"
                                width={48}
                                height={48}
                            />
                            <Image
                                className='h-12 w-12 my-auto object-cover rounded-full ring-0 ring-gray-500 -ml-2'
                                src="/user_3.jpg"
                                alt="Happy user 3"
                                width={48}
                                height={48}
                            />
                            <Image
                                className='h-12 w-12 my-auto object-cover rounded-full ring-0 ring-gray-500 -ml-2'
                                src="/user_4.jpg"
                                alt="Happy user 4"
                                width={48}
                                height={48}
                            />
                            <Image
                                className='h-12 w-12 my-auto object-cover rounded-full ring-0 ring-gray-500 -ml-2'
                                src="/user_5.jpg"
                                alt="Happy user 5"
                                width={48}
                                height={48}
                            />

                            <p className='ml-4 my-auto text-sm text-gray-600'>Loved by 1,000+ happy users</p>
                        </div>
                    </div>
                </div>

                {InstallNodeDiv()}
                <div suppressHydrationWarning className="w-full max-w-2xl mx-auto mt-4 px-4 sm:px-0">
                    <div className="overflow-x-auto">
                        <CodeBlock code={codeSnippet} lang="bash" theme="github-dark" />
                    </div>
                </div>

            </div>
        </div>
    );
}