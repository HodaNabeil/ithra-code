import './globals.css';
import { cn } from '../lib/utils';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { NavigationTopLoader } from '@/providers/NavigationTopLoader';
import { QueryProvider } from '@/providers/QueryProvider';
import { getAuthSession } from '@/lib/get-auth-session';
import { Toaster } from '@/components/ui/sonner';
import { buildRootLayoutMetadata } from '@/lib/seo/root-metadata';
import { JsonLd } from '@/lib/seo/json-ld/json-ld';
import { buildWebSiteSchema } from '@/lib/seo/json-ld/website-schema';

export const metadata = {
  ...buildRootLayoutMetadata(),
  icons: {
    icon: [
      {
        url: '/favicon/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon-32x32.png',
        sizes: '32x32',
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
  const session = await getAuthSession();

  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <JsonLd id="website-schema" data={buildWebSiteSchema()} />
      </head>
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
