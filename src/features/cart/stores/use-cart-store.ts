'use client';

import { create } from 'zustand';

interface CartStore {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementItemCount: () => void;
  decrementItemCount: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: Math.max(0, count) }),
  incrementItemCount: () =>
    set((state) => ({ itemCount: state.itemCount + 1 })),
  decrementItemCount: () =>
    set((state) => ({ itemCount: Math.max(0, state.itemCount - 1) })),
}));
