export const CART_ENDPOINTS = {
  ROOT: '/cart',
  ITEMS: '/cart/items',
  ITEM: (courseId: string) => `/cart/items/${courseId}`,
} as const;
