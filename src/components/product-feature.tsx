import { getTranslations } from "next-intl/server";
import { Terminal, Cloud, MonitorSpeaker } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProductFeature() {
  const t = await getTranslations("productFeatures");

  const features = [
    {
      key: "cli",
      icon: Terminal
    },
    {
      key: "ide",
      icon: MonitorSpeaker
    },
    {
      key: "cloud",
      icon: Cloud
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

        {/* Feature Cards Grid - Bottom */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.key} className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-[#f8f8f8] dark:bg-card border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-0">
                <feature.icon className="w-5 h-5 mb-4 text-gray-600 dark:text-gray-400" />
                <CardTitle className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                  {t(`features.${feature.key}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="leading-relaxed text-base text-gray-600 dark:text-gray-400">
                  {t(`features.${feature.key}.description`)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}