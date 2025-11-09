import { useTranslations } from "next-intl";
import { BadgeDollarSign } from "lucide-react";
import clsx from "clsx";

const CARD_CONFIG = [
    {
        key: "input",
        price: "$1.25",
        accentClass: "text-foreground",
        containerClass: "bg-accent/5",
        helperKey: undefined,
    },
    {
        key: "buffered",
        price: "$0.125",
        accentClass: "text-green-500",
        helperKey: "cards.buffered.helper",
        containerClass: "bg-accent/10 ring-1 ring-green-500/20",
    },
    {
        key: "output",
        price: "$10",
        accentClass: "text-foreground",
        containerClass: "bg-accent/5",
        helperKey: undefined,
    },
] as const;

export default function TokenPricing() {
    const t = useTranslations("tokenPricing");

    return (
        <section className="px-4 py-12 sm:py-16 section-themed">
            <div className="max-w-7xl mx-auto">
                <div className="rounded-[32px] border border-border bg-card text-card-foreground shadow-lg">
                    <div className="space-y-8 p-6 sm:p-10">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl border border-border bg-accent/5 p-3 text-primary">
                                    <BadgeDollarSign className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                        {t("eyebrow")}
                                    </p>
                                    <h2 className="text-3xl font-semibold sm:text-4xl">
                                        {t("title")}
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {t("description")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {CARD_CONFIG.map(card => (
                                <div
                                    key={card.key}
                                    className={clsx(
                                        "rounded-3xl border border-border p-6 sm:p-7",
                                        "flex flex-col gap-2",
                                        card.containerClass
                                    )}
                                >
                                    <p className="text-sm text-muted-foreground">
                                        {t(`cards.${card.key}.title`)}
                                    </p>
                                    <div className="flex items-end gap-2">
                                        <span className={clsx("text-3xl font-semibold sm:text-4xl", card.accentClass)}>
                                            {card.price}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {t("unit")}
                                        </span>
                                    </div>
                                    {card.helperKey && (
                                        <p className="text-sm font-medium text-green-500">
                                            {t(card.helperKey)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
