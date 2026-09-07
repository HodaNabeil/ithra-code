'use client';

import { useSyncExternalStore } from 'react';

import {
  DEFAULT_DIRECTION,
  DIRECTIONS,
  type Direction,
} from '@/constants/i18n';

function getDocumentDirection(): Direction {
  if (typeof document === 'undefined') {
    return DEFAULT_DIRECTION;
  }

  return document.documentElement.dir === DIRECTIONS.LTR
    ? DIRECTIONS.LTR
    : DIRECTIONS.RTL;
}

export function useDocumentDirection(): Direction {
  return useSyncExternalStore(
    () => () => {},
    getDocumentDirection,
    () => DEFAULT_DIRECTION,
  );
}
