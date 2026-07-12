'use client';

import { useEffect, useLayoutEffect } from 'react';
import { create } from 'zustand';
import type { CourseListDTO as Course } from '@/types/course/course.dto';
import type { CartDataType as Cart, CartItemType } from '@/types/cart/cart';
import { STORAGE_KEYS } from '@/constant/storage';

const useClientLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// localStorage is the single source of truth for the guest cart. Stores
// { ids, cache } where `ids` is the ordered list of course IDs and `cache`
// holds the full Course objects keyed by id for offline rendering. On login,
// the cart page reads the ids from this store and forwards them to the API
// via syncGuestCartAction, then clears the store.

type CourseCache = Record<string, Course>;

interface StoredCart {
  ids: string[];
  cache: CourseCache;
}

function readStorage(): StoredCart {
  if (typeof window === 'undefined') return { ids: [], cache: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GUEST_CART);
    if (!raw) return { ids: [], cache: {} };
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.filter((v): v is string => typeof v === 'string')
      : [];
    const cache =
      parsed.cache && typeof parsed.cache === 'object'
        ? (parsed.cache as CourseCache)
        : {};
    return { ids, cache };
  } catch {
    return { ids: [], cache: {} };
  }
}

function writeStorage(data: StoredCart): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.GUEST_CART, JSON.stringify(data));
  } catch {
    // Quota / private mode — silently ignore
  }
}

function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.GUEST_CART);
}

interface GuestCartStore {
  ids: string[];
  cache: CourseCache;
  hydrated: boolean;
  hydrate: () => void;
  addGuestItem: (course: Course) => void;
  removeGuestItem: (courseId: string) => void;
  hasGuestCourse: (courseId: string) => boolean;
  clearGuestCart: () => void;
}

const useGuestCartStore = create<GuestCartStore>((set, get) => ({
  ids: [],
  cache: {},
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const { ids, cache } = readStorage();
    // Drop cached entries no longer in ids
    const trimmed: CourseCache = {};
    for (const id of ids) {
      if (cache[id]) trimmed[id] = cache[id];
    }
    set({ ids, cache: trimmed, hydrated: true });
  },

  addGuestItem: (course) => {
    const { ids, cache } = get();
    if (ids.includes(course.id)) return;

    const nextIds = [...ids, course.id];
    const nextCache = { ...cache, [course.id]: course };
    writeStorage({ ids: nextIds, cache: nextCache });
    set({ ids: nextIds, cache: nextCache });
  },

  removeGuestItem: (courseId) => {
    const { ids, cache } = get();
    if (!ids.includes(courseId)) return;

    const nextIds = ids.filter((id) => id !== courseId);
    const { [courseId]: _removed, ...nextCache } = cache;
    void _removed;
    writeStorage({ ids: nextIds, cache: nextCache });
    set({ ids: nextIds, cache: nextCache });
  },

  hasGuestCourse: (courseId) => get().ids.includes(courseId),

  clearGuestCart: () => {
    clearStorage();
    set({ ids: [], cache: {} });
  },
}));

const hydrate = useGuestCartStore.getState().hydrate;

export function useGuestCart() {
  const store = useGuestCartStore();

  useClientLayoutEffect(() => {
    hydrate();
  }, []);

  const buildGuestCart = (): Cart | null => {
    const { ids, cache } = store;
    const courses = ids
      .map((id) => cache[id])
      .filter((c): c is Course => Boolean(c));

    if (courses.length === 0) return null;

    const items: CartItemType[] = courses.map((course) => ({
      ...course,
      totalDurationText:
        course.hours != null && course.hours > 0
          ? `${course.hours} ساعة`
          : `${course.lecturesCount} محاضرة`,
    }));

    const subtotal = courses.reduce(
      (sum, c) => sum + (c.compareAtPrice ?? c.price),
      0,
    );
    const total = courses.reduce((sum, c) => sum + c.price, 0);
    const discount =
      subtotal > 0 ? Math.round(((subtotal - total) / subtotal) * 100) : 0;
    const currency = courses[0]?.currency ?? 'EGP';

    return {
      id: 'guest',
      userId: '',
      items,
      total,
      subtotal,
      discount,
      currency,
      coupon: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    guestIds: store.ids,
    guestCartHydrated: store.hydrated,
    addGuestItem: store.addGuestItem,
    removeGuestItem: store.removeGuestItem,
    hasGuestCourse: store.hasGuestCourse,
    clearGuestCart: store.clearGuestCart,
    buildGuestCart,
  };
}
