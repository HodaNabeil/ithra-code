import type { Metadata } from 'next';
import './globals.css';
import { cn } from '../lib/utils';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { NavigationTopLoader } from '@/providers/NavigationTopLoader';
import { QueryProvider } from '@/providers/QueryProvider';
import { auth } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SEO_OG_LOCALE,
  SEO_SITE_NAME_AR,
  SEO_SITE_NAME_EN,
} from '@/lib/seo/config';
import { isSeoIndexingEnabled } from '@/lib/seo/environment';
import { getSiteOrigin } from '@/lib/seo/urls';

const indexingEnabled = isSeoIndexingEnabled();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${SEO_DEFAULT_TITLE} | ${SEO_SITE_NAME_AR}`,
    template: `%s | ${SEO_SITE_NAME_AR}`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  robots: {
    index: indexingEnabled,
    follow: indexingEnabled,
  },
  openGraph: {
    siteName: SEO_SITE_NAME_EN,
    locale: SEO_OG_LOCALE,
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/favicon/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className={cn(
          'min-h-full font-sans bg-body-background',
          'flex',
          'flex-col',
        )}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NavigationTopLoader />
          <QueryProvider>
            <AuthProvider session={session}>
              {children}
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
