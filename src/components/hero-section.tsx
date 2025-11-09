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
                {t('hero.installNodeJs')}{' '} <Link href="https://nodejs.org/" target="_blank" className="text-muted-foreground underline">Node.js 18+</Link>, {t('hero.thenRun')}:
            </p>
        </div>
    );
}

export default function HeroSection() {
    const t = useTranslations();
    const locale = useLocale();
    const codeSnippet = `npm install -g @anthropic-ai/claude-code`;

    return (
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 section-themed">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left Column - Content */}
                <div className="text-center md:text-left">
                    <h1 className="text-5xl md:text-7xl font-medium text-foreground mb-6 tracking-tight">
                        {t("hero.title")}
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 mb-12">
                        <Button
                            variant="black"
                            size="lg"
                            className="text-lg px-8 py-4 h-12 rounded-2xl transition-colors duration-200 button-themed"
                            asChild
                        >
                            <Link href={`/${locale}/docs`}>
                                {t("hero.cta")} <Zap />
                            </Link>
                        </Button>

                        <Button
                            variant="link"
                            size="lg"
                            className="text-lg px-8 py-4 h-12 rounded-2xl text-foreground hover:text-muted-foreground" asChild
                        >
                            <Link href={`/${locale}/#pricing`}>
                                {t('pricingModal.upgrade')} <ArrowRight />
                            </Link>
                        </Button>

                    </div>

                    <div className="mt-8">
                        {InstallNodeDiv()}
                        <div suppressHydrationWarning className="w-full max-w-2xl mt-4 px-4 sm:px-0">
                            <div className="overflow-x-auto">
                                <CodeBlock
                                    code={codeSnippet}
                                    lang="bash"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Hero Image */}
                <div className="flex items-center justify-center">
                    <Image
                        src="/hero.png"
                        alt="Hero illustration showing Claude Code features and capabilities"
                        width={600}
                        height={400}
                        className="w-full h-auto max-w-lg md:max-w-xl object-contain"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}