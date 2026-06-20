'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

function isSuppressedDevConsoleError(message: string): boolean {
  if (message.includes('Encountered a script tag while rendering React component')) {
    return true;
  }

  // swagger-ui-react still uses UNSAFE_ lifecycle methods (e.g. ParameterRow).
  if (message.includes('UNSAFE_componentWillReceiveProps in strict mode')) {
    return true;
  }

  return false;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const originalError = console.error;

    console.error = (...args) => {
      if (typeof args[0] === 'string' && isSuppressedDevConsoleError(args[0])) {
        return;
      }

      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
