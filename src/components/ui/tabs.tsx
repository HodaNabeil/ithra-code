'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useKeenSlider } from 'keen-slider/react';
import { cn } from '@/lib';
import 'keen-slider/keen-slider.min.css';
import { DIRECTIONS } from '@/constants/i18n';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      dir={DIRECTIONS.RTL}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: true,
    slides: {
      perView: 'auto',
      spacing: 20,
    },
    defaultAnimation: {
      duration: 300,
      easing: (t) => 1 - (1 - t) ** 3,
    },
    breakpoints: {
      '(min-width: 768px)': {
        disabled: true,
      },
    },
  });

  // Slides are sized to their content (w-fit), which can measure as ~0 before
  // layout settles or when a label's text changes (e.g. async ratings count),
  // collapsing the track. Re-measure after paint to keep positions correct.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => instanceRef.current?.update());
    return () => cancelAnimationFrame(id);
  });

  React.useEffect(() => {
    const slider = instanceRef.current;
    if (!slider) return;

    const scrollActiveTabIntoView = () => {
      if (slider.options.disabled) return;

      const activeTrigger = slider.container.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]',
      );
      if (!activeTrigger) return;

      const slide = activeTrigger.closest('.keen-slider__slide');
      if (!slide) return;

      const slides = Array.from(
        slider.container.querySelectorAll('.keen-slider__slide'),
      );
      const index = slides.indexOf(slide);
      if (index >= 0) {
        slider.moveToIdx(index, true);
      }
    };

    scrollActiveTabIntoView();

    const observer = new MutationObserver(scrollActiveTabIntoView);
    observer.observe(slider.container, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => observer.disconnect();
  }, [instanceRef]);

  return (
    <div className="border-b-2 border-border overflow-hidden md:overflow-visible">
      <TabsPrimitive.List
        ref={sliderRef}
        data-slot="tabs-list"
        className={cn(
          'keen-slider flex! h-9 w-full md:items-center md:grid! md:auto-cols-max md:grid-flow-col md:gap-5 md:w-fit',
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child) => (
          <div className="keen-slider__slide overflow-visible! w-fit! shrink-0">
            {child}
          </div>
        ))}
      </TabsPrimitive.List>
    </div>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:text-foreground data-[state=active]:font-bold hover:text-foreground text-gray-alpha-500 inline-flex h-full pb-2 shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 border-b-2 border-transparent data-[state=active]:border-foreground -mb-1 relative md:text-base [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
