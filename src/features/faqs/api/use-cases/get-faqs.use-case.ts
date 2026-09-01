import { prisma } from '@/lib/prisma';
import type { FaqQuery, FaqResult, FaqItem } from '../dto/faq.dto';

/**
 * Fetch active FAQs from the database.
 * Filters by isActive = true and sorts by sortOrder ASC, createdAt ASC.
 */
async function findActiveFaqs(skip: number, take: number): Promise<FaqItem[]> {
  const faqs = await prisma.faq.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    skip,
    take,
    select: {
      id: true,
      question: true,
      answer: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return faqs.map(mapFaqToDTO);
}

/**
 * Get total count of active FAQs.
 */
async function getActiveFaqCount(): Promise<number> {
  return prisma.faq.count({
    where: {
      isActive: true,
    },
  });
}

/**
 * Map database FAQ to DTO format.
 */
function mapFaqToDTO(faq: {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FaqItem {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
    isActive: faq.isActive,
    createdAt: faq.createdAt.toISOString(),
    updatedAt: faq.updatedAt.toISOString(),
  };
}

/**
 * Main use-case: fetch active FAQs with pagination.
 *
 * Business logic:
 * 1. Run parallel queries for FAQs and total count
 * 2. Filter only active FAQs (isActive = true)
 * 3. Sort by sortOrder ASC, then createdAt ASC
 * 4. Apply pagination
 * 5. Return paginated result with metadata
 */
export async function getFaqs(query: FaqQuery): Promise<FaqResult> {
  const skip = (query.page - 1) * query.limit;

  // Run queries in parallel for performance
  const [faqs, total] = await Promise.all([
    findActiveFaqs(skip, query.limit),
    getActiveFaqCount(),
  ]);

  return {
    items: faqs,
    total,
    pagination: {
      currentPage: query.page,
      totalPages: Math.ceil(total / query.limit),
      totalItems: total,
      itemsPerPage: query.limit,
    },
  };
}