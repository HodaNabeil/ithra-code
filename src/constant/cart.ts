export const CART_ENDPOINTS = {
  ITEMS: '/cart/items',
  ITEM: (courseId: string) => `/cart/items/${courseId}`,
} as const;
