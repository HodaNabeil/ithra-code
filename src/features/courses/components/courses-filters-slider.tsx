'use client';

import type { ReactNode } from 'react';
import { HorizontalSlider } from '@/components/shared/horizontal-slider';

interface CoursesFiltersSliderProps {
  children: ReactNode;
}

export function CoursesFiltersSlider({ children }: CoursesFiltersSliderProps) {
  return (
    <HorizontalSlider
      disabledAt="(min-width: 1024px)"
      perView="auto"
      spacing={8}
      className="w-auto flex lg:grid! lg:grid-cols-3 lg:gap-4 overflow-visible"
      slideClassName="overflow-visible! min-w-[150px] lg:min-w-0"
    >
      {children}
    </HorizontalSlider>
  );
}
