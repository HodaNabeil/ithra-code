'use client';

import NextTopLoader from 'nextjs-toploader';

export function NavigationTopLoader() {
  return (
    <NextTopLoader
      color="var(--fm-red-1)"
      height={2}
      showSpinner={false}
      crawl
      crawlSpeed={200}
      speed={250}
      easing="ease"
      zIndex={9999}
    />
  );
}
