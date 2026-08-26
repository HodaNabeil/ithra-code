'use client';

import { useRef, useState, ReactNode } from 'react';

interface CourseCardWrapperProps {
  children: ReactNode;
  hoverCard?: ReactNode;
  className?: string;
}

export function CourseCardWrapper({
  children,
  hoverCard,
  className = '',
}: CourseCardWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCard = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsVisible(true);
  };

  const hideCard = () => {
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  if (!hoverCard) {
    return <div className={`relative h-full ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`relative h-full ${className}`}
      onMouseEnter={showCard}
      onMouseLeave={hideCard}
    >
      {children}

      {/* Hover Card */}
      <div
        className={`course-hover-card absolute z-50 w-80 p-6 bg-card border border-border/60 rounded-xl shadow-2xl
          transition-all duration-300
          bottom-[calc(100%+0.8rem)] left-1/2 -translate-x-1/2
          lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:translate-x-0 lg:right-[calc(100%+0.8rem)]
          ${isVisible ? 'block opacity-100' : 'hidden opacity-0'}`}
        onMouseEnter={showCard}
        onMouseLeave={hideCard}
      >
        {hoverCard}
      </div>
    </div>
  );
}
