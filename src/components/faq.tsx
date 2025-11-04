import { getTranslations } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import FAQClient from "./faq-client";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

export default async function FAQ() {
  const t = await getTranslations();
  const faqData: FAQItem[] = t.raw("faq.items") as FAQItem[];

  return (
    <section className="py-20 bg-[#faf9f5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t("faq.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto" suppressHydrationWarning>
          <FAQClient faqData={faqData} />
        </div>

        {/* Additional Help */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {t("faq.moreQuestions")}
          </p>
          <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            <Link href="mailto:cfjwlchangji@gmail.com?subject=addtional question for claude-ide!">
              {t("faq.contactSupport")}
            </Link>
          </button>
        </div>
      </div>
    </section>
  );
}