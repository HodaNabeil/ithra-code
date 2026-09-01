import { ErrorRetry } from '@/components/shared';
import { FaqsAccordion } from './faqs-accordion';
import SectionHeading from './section-heading';
import { FAQ } from '../services/server/faqsApi';

interface FaqsSectionProps {
  faqs: FAQ[];
  hasError: boolean;
  errorMessage?: string;
}

export default function FaqsSection({
  faqs,
  hasError,
  errorMessage,
}: FaqsSectionProps) {
  return (
    <section className="pb-16 md:pb-20 lg:pb-24">
      <div className="container">
        <SectionHeading
          subTitle="لديك استفسار؟ تجد إجابته هنا"
          title="الأسئلة الشائعة"
        />
        <div className="max-w-5xl mx-auto mt-12 w-full">
          {hasError ? (
            <ErrorRetry message={errorMessage} />
          ) : faqs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              لا توجد أسئلة شائعة حالياً
            </p>
          ) : (
            <FaqsAccordion faqs={faqs} />
          )}
        </div>
      </div>
    </section>
  );
}
