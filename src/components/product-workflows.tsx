import { getTranslations } from "next-intl/server";
import { Sparkles, Timer, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProductWorkflows() {
  const t = await getTranslations("productWorkflows");

  const workflows = [
    {
      key: "powerful",
      icon: Sparkles,
      accent: "from-yellow-500/30 to-transparent"
    },
    {
      key: "easy",
      icon: Timer,
      accent: "from-blue-500/30 to-transparent"
    },
    {
      key: "cheap",
      icon: Wallet,
      accent: "from-emerald-500/30 to-transparent"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 section-themed">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Top */}
        <div className="text-left mb-8">
          <h2 className="text-4xl lg:text-5xl font-medium text-foreground leading-tight ">
            {t("title")}
          </h2>
        </div>

        {/* Workflow Cards Grid - Bottom */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workflows.map((workflow) => (
            <Card
              key={workflow.key}
              className="h-full border border-white/10 bg-background/60 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <CardHeader className="pb-2">
                <div className={`inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r ${workflow.accent} px-4 py-2`}>
                  <workflow.icon className="w-5 h-5 text-foreground" />
                  <span className="text-xs uppercase tracking-[0.2em] text-foreground/80">
                    {t(`workflows.${workflow.key}.title`)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardTitle className="text-2xl font-semibold leading-tight text-foreground">
                  {t(`workflows.${workflow.key}.title`)}
                </CardTitle>
                <CardDescription className="leading-relaxed text-base text-muted-foreground">
                  {t(`workflows.${workflow.key}.content`)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
