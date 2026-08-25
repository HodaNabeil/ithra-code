'use client';

import { useState } from 'react';
import SectionHeading from './section-heading';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FaqsSectionProps {
  faqs: FAQ[];
  hasError?: boolean;
  errorMessage?: string;
}

export default function FaqsSection({ faqs, hasError }: FaqsSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (hasError || !faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="الأسئلة الشائعة"
          title="إجابات على أسئلتك حول IthraCode"
        />
        <div className="max-w-3xl mx-auto mt-12 w-full">
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openItems.has(faq.id);
              return (
                <div
                  key={faq.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-4 text-right bg-card hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-foreground">
                      {faq.question}
                    </span>
                    <span
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 py-4 bg-muted/20 border-t border-border">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
