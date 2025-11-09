"use client";

import { useState } from "react";
import { BookOpen, GitPullRequest, Code, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductFunctionality() {
  const t = useTranslations("useCases");
  const [activeUseCase, setActiveUseCase] = useState("step1");

  const useCases = [
    {
      key: "step1",
      icon: BookOpen,
      image: "/usecase_1.png"
    },
    {
      key: "step2",
      icon: Terminal,
      image: "/usecase_2.png"
    },
    {
      key: "step3",
      icon: Code,
      image: "/usecase_3.png"
    },
    {
      key: "step4",
      icon: GitPullRequest,
      image: "/usecase_4.png"
    }
  ];

  const getCurrentImage = () => {
    const currentUseCase = useCases.find(uc => uc.key === activeUseCase);
    return currentUseCase?.image || "/usecase_1.png";
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 section-themed">
      <div className="max-w-7xl mx-auto">
        {/* Title Section - Full Width */}
        <div className="text-left mb-16">
          <h2 className="text-4xl lg:text-5xl font-medium text-foreground leading-tight ">
            {t("title")}
          </h2>
        </div>

        {/* Second Row - Terminal Demo Left, Accordion Right */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Use Case Image */}
          <div className="order-1 lg:order-1">
            <div className="relative w-full h-[500px]">
              <Image
                src={getCurrentImage()}
                alt="Use case demonstration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Right: Accordion Content */}
          <div className="order-2 lg:order-2">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={activeUseCase}
              onValueChange={setActiveUseCase}
            >
              {useCases.map((useCase) => (
                <AccordionItem key={useCase.key} value={useCase.key}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <useCase.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {t(`${useCase.key}.title`)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed ml-13">
                      {t(`${useCase.key}.description`)}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}