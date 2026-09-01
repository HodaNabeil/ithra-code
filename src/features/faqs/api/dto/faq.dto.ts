/**
 * FAQ item returned by the API.
 * Represents a single FAQ entry with all public fields.
 */
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Pagination metadata for FAQ list responses.
 */
export type FaqPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

/**
 * Query parameters for fetching FAQs.
 */
export type FaqQuery = {
  page: number;
  limit: number;
};

/**
 * Result returned by getFaqs use-case.
 */
export type FaqResult = {
  items: FaqItem[];
  total: number;
  pagination: FaqPagination;
};