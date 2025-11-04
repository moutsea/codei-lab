import { getTranslations } from "next-intl/server";
import { Brain, Zap, Terminal } from "lucide-react";
import ProductFeatureVideo from "./product-feature-video";

export default async function ProductFeature() {
  const t = await getTranslations("productFeatures");

  const features = [
    {
      key: "intelligentUnderstanding",
      icon: Brain
    },
    {
      key: "worksWhereYouWork",
      icon: Terminal
    },
    {
      key: "seamlessIntegration",
      icon: Zap
    }
  ];

  return (
    <section className="py-20 bg-[#faf9f5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Video */}
          <div className="order-2 lg:order-1">
            <ProductFeatureVideo />
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {t("title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed lg:text-lg">
                {t("description")}
              </p>
            </div>

            <div className="space-y-8">
              {features.map((feature) => (
                <div key={feature.key} className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                    <feature.icon className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl lg:text-xl font-semibold text-foreground">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base lg:text-base">
                      {t(`features.${feature.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}