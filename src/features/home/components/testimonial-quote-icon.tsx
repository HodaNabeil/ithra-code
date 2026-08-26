interface TestimonialQuoteIconProps {
  gradientId: string;
  className?: string;
}

/**
 * Filled opening-quote icon with warm orange gradient (matches testimonial card design).
 */
export function TestimonialQuoteIcon({
  gradientId,
  className = 'size-9',
}: TestimonialQuoteIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(2 70% 42%)" />
          <stop offset="55%" stopColor="#c4710d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M16 4a2 2 0 0 0-2 2v1H9a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-5H11a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h4a1 1 0 0 1 1 1v3a5 5 0 0 1-5 5h-2"
      />
      <path
        fill={`url(#${gradientId})`}
        d="M8 9a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-5H7a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h1a1 1 0 0 1 1 1v3a5 5 0 0 1-5 5H6"
      />
    </svg>
  );
}
