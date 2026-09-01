import { create } from 'zustand';
import type { CartDataType, CartItemType } from '@/types/cart/cart';

interface CartState {
  cart: CartDataType | null;
  items: CartItemType[];
  itemCount: number;
  setCart: (cart: CartDataType | null) => void;
  hasCourse: (courseId: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  items: [],
  itemCount: 0,
  setCart: (cart) => {
    // Note: items might come in as part of cart.items, previously typed as unknown as CartItem[]
    const items = cart?.items ?? [];
    set({ cart, items, itemCount: items.length });
  },
  hasCourse: (courseId) => {
    const { items } = get();
    return items.some((item) => item.id === courseId);
  },
}));
