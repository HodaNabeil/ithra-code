'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DIRECTIONS } from '@/constants/i18n';
import { FAQ } from '../services/server/faqsApi';

interface FaqsAccordionProps {
  faqs: FAQ[];
}

export function FaqsAccordion({ faqs }: FaqsAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={faqs[0]?.id}
      dir={DIRECTIONS.RTL}
      className="w-full rounded-lg overflow-hidden border border-border bg-panel"
    >
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.id}
          value={faq.id}
          className="border-b border-border last:border-b-0 px-6"
        >
          <AccordionTrigger className="py-4 text-xl font-bold hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-4">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
