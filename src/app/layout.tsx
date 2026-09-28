import './globals.css';
import { cn } from '../lib/utils';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { NavigationTopLoader } from '@/providers/NavigationTopLoader';
import { QueryProvider } from '@/providers/QueryProvider';
import { auth } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import { buildRootLayoutMetadata } from '@/lib/seo/root-metadata';

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
