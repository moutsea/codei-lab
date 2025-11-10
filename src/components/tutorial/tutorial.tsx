"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ExternalLink, BookOpen, Terminal, CreditCard, Key, Sparkles } from "lucide-react";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  onClick?: () => void;
}

function Step({ number, title, description, icon, completed, onClick }: StepProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        {completed ? (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Circle className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Step {number}</span>
          {icon}
        </div>
        <h3 className="text-lg font-semibold mt-1 text-foreground">{title}</h3>
        <div className="text-muted-foreground mt-1">
          {description.split('\n').map((paragraph, index) => {
            // Check if the paragraph is a command (starts with spaces followed by command)
            const isCommand = paragraph.trim().match(/^(node --version|npm install -g @openai\/codex)/);

            if (isCommand) {
              return (
                <div key={index} className="mb-2">
                  <code className="bg-muted text-primary px-2 py-1 rounded font-mono text-sm border border-border">
                    {paragraph.trim()}
                  </code>
                </div>
              );
            }

            // Check if paragraph contains Node.js version text and make it a clickable link
            if (paragraph.includes('Node.js version 18.0.0 or higher') ||
              paragraph.includes('Node.js version 18.0.0 或更高版本') ||
              paragraph.includes('Node.js version 18.0.0 ou supérieure')) {

              const linkText = paragraph.includes('Node.js version 18.0.0 or higher')
                ? 'Node.js version 18.0.0 or higher'
                : paragraph.includes('Node.js version 18.0.0 或更高版本')
                  ? 'Node.js version 18.0.0 或更高版本'
                  : 'Node.js version 18.0.0 ou supérieure';

              return (
                <p key={index} className="mb-2">
                  {paragraph.split(linkText).map((part, partIndex) => (
                    <span key={partIndex}>
                      {part}
                      {partIndex === 0 && (
                        <a
                          href="https://nodejs.org/en/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline"
                        >
                          {linkText}
                        </a>
                      )}
                    </span>
                  ))}
                </p>
              );
            }

            return <p key={index} className="mb-2">{paragraph}</p>;
          })}
        </div>
        {onClick && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onClick}
          >
            Learn More
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Tutorial() {
  const t = useTranslations("tutorial");
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // 获取当前 locale
  const locale = useLocale();

  
  const steps = [
    {
      number: 1,
      title: t("step1.title"),
      description: t("step1.description"),
      icon: <BookOpen className="w-4 h-4" />,
      completed: completedSteps.has(1),
      onClick: () => router.push(`/${locale}/docs`)
    },
    {
      number: 2,
      title: t("step2.title"),
      description: t("step2.description"),
      icon: <Terminal className="w-4 h-4" />,
      completed: completedSteps.has(2)
    },
    {
      number: 3,
      title: t("step3.title"),
      description: t("step3.description"),
      icon: <CreditCard className="w-4 h-4" />,
      completed: completedSteps.has(3),
      onClick: () => window.open(`/${locale}#pricing`, "_blank")
    },
    {
      number: 4,
      title: t("step4.title"),
      description: t("step4.description"),
      icon: <Key className="w-4 h-4" />,
      completed: completedSteps.has(4)
    },
    {
      number: 5,
      title: t("step5.title"),
      description: t("step5.description"),
      icon: <Sparkles className="w-4 h-4" />,
      completed: completedSteps.has(5)
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {t("steps.title")}
        </h2>

        {steps.map((step) => (
          <Step
            key={step.number}
            number={step.number}
            title={step.title}
            description={step.description}
            icon={step.icon}
            completed={step.completed}
            onClick={step.onClick}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("help.title")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("help.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => window.open(`/${locale}/docs`)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("help.documentation")}
            </Button>
            {/* <Button onClick={() => window.open("https://github.com/anthropics/claude-code/discussions", "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("help.community")}
            </Button> */}
          </div>
        </div>
      </div>


    </div>
  );
}