import { getTranslations } from "next-intl/server";
import { BookOpen, GitPullRequest, Code } from "lucide-react";
import TerminalDemo from "./terminal-demo";

export default async function ProductFunctionality() {
  const t = await getTranslations("useCases");

  const useCases = [
    {
      key: "codeOnboarding",
      icon: BookOpen
    },
    {
      key: "issueToPR",
      icon: GitPullRequest
    },
    {
      key: "powerfulEdits",
      icon: Code
    }
  ];

  return (
    <section className="py-20 bg-[#faf9f5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="order-2 lg:order-1 space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {t("title")}
              </h2>
            </div>

            <div className="space-y-8">
              {useCases.map((useCase) => (
                <div key={useCase.key} className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
                    <useCase.icon className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl lg:text-xl font-semibold text-foreground">
                      {t(`${useCase.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base lg:text-base">
                      {t(`${useCase.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal Demo */}
          <div className="order-1 lg:order-2">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}