'use client';

import * as React from 'react';
import { useKeenSlider } from 'keen-slider/react';
import { cn } from '@/lib/utils';
import 'keen-slider/keen-slider.min.css';

export type SlideBreakpointConfig = {
  perView?: number | 'auto';
  spacing?: number;
};

interface HorizontalSliderProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children'
> {
  children: React.ReactNode;
  perView?: number | 'auto';
  disabledAt?: string;
  slidesBreakpoints?: Record<string, SlideBreakpointConfig>;
  spacing?: number;
  slideClassName?: string;
}

export const HorizontalSlider = React.forwardRef<
  HTMLDivElement,
  HorizontalSliderProps
>(function HorizontalSlider(
  {
    children,
    perView = 'auto',
    disabledAt,
    slidesBreakpoints,
    spacing = 16,
    className,
    slideClassName,
    ...rest
  },
  ref,
) {
  const breakpoints = React.useMemo(() => {
    const merged: Record<
      string,
      {
        disabled?: boolean;
        slides?: { perView?: number | 'auto'; spacing?: number };
      }
    > = {};

    if (slidesBreakpoints) {
      for (const [mediaQuery, config] of Object.entries(slidesBreakpoints)) {
        merged[mediaQuery] = {
          slides: {
            perView: config.perView ?? perView,
            spacing: config.spacing ?? spacing,
          },
        };
      }
    }

    if (disabledAt) {
      merged[disabledAt] = {
        ...merged[disabledAt],
        disabled: true,
      };
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [disabledAt, perView, slidesBreakpoints, spacing]);

  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: true,
    slides: {
      perView,
      spacing,
    },
    breakpoints,
  });

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      sliderRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, sliderRef],
  );

  // Slides are sized to their content (w-fit), which can measure as ~0 before
  // layout settles or when slide content changes — re-measure after paint.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => instanceRef.current?.update());
    return () => cancelAnimationFrame(id);
  });

  return (
    <div ref={setRefs} className={cn('keen-slider', className)} {...rest}>
      {React.Children.map(children, (child) => (
        <div className={cn('keen-slider__slide', slideClassName)}>{child}</div>
      ))}
    </div>
  );
});
