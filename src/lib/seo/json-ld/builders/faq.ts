import type { JsonLdObject } from '../types';

export type FaqSchemaInput = {
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export function buildFaqSchema(input: FaqSchemaInput): JsonLdObject | null {
  if (input.items.length === 0) {
    return null;
  }

  return {
    '@type': 'FAQPage',
    mainEntity: input.items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
