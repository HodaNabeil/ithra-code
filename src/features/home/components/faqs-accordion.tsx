import { ChevronDown } from 'lucide-react';
import { DIRECTIONS } from '@/constants/i18n';
import { FAQ } from '../services/server/faqsApi';
import { cn } from '@/lib/utils';

const FAQS_ACCORDION_NAME = 'home-faqs';

interface FaqsAccordionProps {
  faqs: FAQ[];
}

export function FaqsAccordion({ faqs }: FaqsAccordionProps) {
  return (
    <div
      dir={DIRECTIONS.RTL}
      className="w-full border rounded-lg overflow-hidden"
    >
      {faqs.map((faq, index) => (
        <details
          key={faq.id}
          name={FAQS_ACCORDION_NAME}
          open={index === 0}
          className="group border-b last:border-b-0 px-6"
        >
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-4 py-4',
              'font-semibold text-sm md:text-base hover:no-underline',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            <span className="flex-1 text-start">{faq.question}</span>
            <ChevronDown
              aria-hidden
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="text-muted-foreground text-base leading-relaxed pb-4 text-start">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
