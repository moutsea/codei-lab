import { useTranslations } from "next-intl";
import { Sparkles, CheckCircle2 } from "lucide-react";
import {
    ReactCompareSlider,
    ReactCompareSliderImage,
} from "react-compare-slider";

interface Benefit {
    key: string;
    title: string;
    description: string;
}

interface ComparisonShot {
    key: string;
    image: string;
    label: string;
    description: string;
}

const Badge = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-3 rounded-full border border-border dark:border-white/20 bg-card dark:bg-neutral-900/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-sm transition-all hover:shadow-md">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{text}</span>
    </div>
);

const BenefitCard = ({ benefit }: { benefit: Benefit }) => (
    <div className="group rounded-2xl border border-border bg-card/90 dark:bg-neutral-900/70 p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
            {benefit.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {benefit.description}
        </p>
    </div>
);

const ComparisonLabel = ({ shot }: { shot: ComparisonShot }) => (
    <div className="flex-1 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {shot.label}
        </p>
        <p className="text-sm text-foreground leading-snug">
            {shot.description}
        </p>
    </div>
);

export default function CaseStudyShowcase() {
    const t = useTranslations("caseStudy");

    const benefits: Benefit[] = [
        {
            key: "rewrite",
            title: t("benefits.rewrite.title"),
            description: t("benefits.rewrite.description"),
        },
        {
            key: "autonomy",
            title: t("benefits.autonomy.title"),
            description: t("benefits.autonomy.description"),
        },
        {
            key: "handoff",
            title: t("benefits.handoff.title"),
            description: t("benefits.handoff.description"),
        },
    ];

    const comparisonShots: ComparisonShot[] = [
        {
            key: "before",
            image: "/before.png",
            label: t("before.label"),
            description: t("before.description"),
        },
        {
            key: "after",
            image: "/after.png",
            label: t("after.label"),
            description: t("after.description"),
        },
    ];

    return (
        <section className="section-themed py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Header Section */}
                <div className="space-y-6 max-w-3xl">
                    <Badge text={t("badge")} />

                    <div className="space-y-4">
                        <h2 className="text-4xl sm:text-5xl font-medium text-foreground leading-tight tracking-tight">
                            {t("title")}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>

                {/* Comparison Section - Main Content */}
                <div className="space-y-8 max-w-5xl mx-auto">
                    <div className="flex items-start justify-between gap-12 max-w-3xl mx-auto">
                        {comparisonShots.map((shot) => (
                            <ComparisonLabel key={shot.key} shot={shot} />
                        ))}
                    </div>

                    <div className="group relative rounded-3xl border border-border bg-card shadow-2xl dark:bg-neutral-900 overflow-hidden transition-all hover:shadow-3xl">
                        <ReactCompareSlider
                            portrait={false}
                            boundsPadding={0}
                            itemOne={
                                <ReactCompareSliderImage
                                    src={comparisonShots[0].image}
                                    alt={comparisonShots[0].label}
                                />
                            }
                            itemTwo={
                                <ReactCompareSliderImage
                                    src={comparisonShots[1].image}
                                    alt={comparisonShots[1].label}
                                />
                            }
                            style={{ width: "100%", height: "600px" }}
                        />
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                    {benefits.map((benefit) => (
                        <BenefitCard key={benefit.key} benefit={benefit} />
                    ))}
                </div>
            </div>
        </section>
    );
}
