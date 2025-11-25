import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export default function HeroSection() {
    const t = useTranslations();
    const locale = useLocale();


    return (
        <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 section-themed">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-10 text-center lg:text-left">
                    <div className="inline-flex items-center justify-center lg:justify-start gap-3 rounded-full border border-white/10 px-5 py-2 text-sm text-muted-foreground">
                        <span className="text-foreground font-semibold uppercase tracking-wide">CodeILab · {t("hero.cta")}</span>
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-medium text-foreground tracking-tight leading-tight">
                            {t("hero.title")}
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            {t("hero.subtitle")}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                        <Button
                            variant="black"
                            size="lg"
                            className="text-lg px-8 py-4 h-12 rounded-2xl transition-colors duration-200 button-themed flex items-center gap-2"
                            asChild
                        >
                            <Link href={`/${locale}/login`}>
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


                </div>

                <div className="w-full">
                    <div className="relative rounded-[32px] bg-background/40 p-6 shadow-2xl backdrop-blur">
                        <Image
                            src="/hero.png"
                            alt="CodeILab hero illustration"
                            width={800}
                            height={600}
                            className="w-full h-auto rounded-3xl object-cover"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
