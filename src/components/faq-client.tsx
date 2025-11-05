import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQClientProps {
  faqData: FAQItem[];
}

export default function FAQClient({ faqData }: FAQClientProps) {

  return (
    <div suppressHydrationWarning={true}>
      <Accordion
        type="single"
        collapsible
        className="space-y-4"
      >
      {faqData.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline hover:bg-background/50 transition-colors">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 text-base text-muted-foreground leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
      </Accordion>
    </div>
  );
}