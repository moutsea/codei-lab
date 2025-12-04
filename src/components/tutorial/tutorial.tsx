"use client";

import { useState, type ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink, BookOpen, CreditCard, Key, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  onClick?: () => void;
  buttonLabel?: string;
  buttonVariant?: ButtonVariant;
  buttonClassName?: string;
  isLast?: boolean;
}

const FormattedDescription = ({ text }: { text: string }) => {
  return (
    <div className="text-muted-foreground leading-relaxed">
      {text.split('\n').map((paragraph, index) => {
        // Check if the paragraph is a command
        const isCommand = paragraph.trim().match(/^(node --version|npm install -g @openai\/codex)/);

        if (isCommand) {
          return (
            <div key={index} className="my-3 group relative">
              <div className="absolute -inset-y-1 -inset-x-2 bg-muted/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-950 text-zinc-100 px-4 py-3 rounded-lg font-mono text-sm border border-zinc-800 shadow-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500 shrink-0" />
                <code className="flex-1">{paragraph.trim()}</code>
              </div>
            </div>
          );
        }

        // Check if paragraph contains Node.js version text and make it a clickable link
        const nodeVersionTexts = [
          'Node.js version 18.0.0 or higher',
          'Node.js version 18.0.0 或更高版本',
          'Node.js version 18.0.0 ou supérieure'
        ];

        const matchedText = nodeVersionTexts.find(t => paragraph.includes(t));

        if (matchedText) {
          return (
            <p key={index} className="mb-2">
              {paragraph.split(matchedText).map((part, partIndex) => (
                <span key={partIndex}>
                  {part}
                  {partIndex === 0 && (
                    <a
                      href="https://nodejs.org/en/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline decoration-primary/30 underline-offset-4"
                    >
                      {matchedText}
                    </a>
                  )}
                </span>
              ))}
            </p>
          );
        }

        if (!paragraph.trim()) return null;
        
        return <p key={index} className="mb-2 last:mb-0">{paragraph}</p>;
      })}
    </div>
  );
};

function Step({
  number,
  title,
  description,
  icon,
  completed,
  onClick,
  buttonLabel,
  buttonVariant = "outline",
  buttonClassName,
  isLast
}: StepProps) {
  return (
    <div className="relative flex items-start gap-6 group">
      {/* Timeline Line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-[19px] top-10 bottom-[-24px] w-0.5",
            completed ? "bg-primary/20" : "bg-border/50"
          )} 
        />
      )}

      {/* Icon Bubble */}
      <div className="relative flex-shrink-0 z-10">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shadow-sm",
          completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "bg-background border-muted-foreground/20 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
        )}>
          {completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-8">
        <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
              Step {number}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <FormattedDescription text={description} />
          
          {onClick && (
            <div className="mt-5">
              <Button
                variant={buttonVariant}
                size="sm"
                className={cn("font-medium", buttonClassName)}
                onClick={onClick}
              >
                {buttonLabel ?? "Learn More"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Tutorial() {
  const t = useTranslations("tutorial");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const locale = useLocale();
  
  const steps: StepProps[] = [
    {
      number: 1,
      title: t("step1.title"),
      description: t("step1.description"),
      icon: <BookOpen className="w-5 h-5" />,
      completed: completedSteps.has(1)
    },
    {
      number: 2,
      title: t("step3.title"),
      description: t("step3.description"),
      icon: <CreditCard className="w-5 h-5" />,
      completed: completedSteps.has(2),
      onClick: () => window.open(`/${locale}#pricing`, "_blank"),
      buttonLabel: t("step3.button"),
      buttonVariant: "black",
      buttonClassName: "text-white shadow-lg hover:bg-zinc-800"
    },
    {
      number: 3,
      title: t("step4.title"),
      description: t("step4.description"),
      icon: <Key className="w-5 h-5" />,
      completed: completedSteps.has(3)
    },
    {
      number: 4,
      title: t("step5.title"),
      description: t("step5.description"),
      icon: <Sparkles className="w-5 h-5" />,
      completed: completedSteps.has(4)
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {t("steps.title")}
          </h2>
        </div>

        <div className="space-y-0">
          {steps.map((step, index) => (
            <Step
              key={step.number}
              {...step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        <div className="mt-16">
          <div className="bg-gradient-to-br from-muted/50 to-background border border-border rounded-2xl p-8 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {t("help.title")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {t("help.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/${locale}/docs`)}
                className="h-11 px-6"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("help.documentation")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
