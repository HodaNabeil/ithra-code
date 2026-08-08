export const ORDER_ENDPOINTS = {
  GET_ORDER: (id: string) => `/api/orders/${id}`,
} as const;
