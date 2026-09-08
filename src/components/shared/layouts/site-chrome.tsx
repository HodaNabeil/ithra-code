import Footer from '@/components/shared/footer';
import { Header } from '@/components/shared/header/Header';
import { auth } from '@/lib/auth';

type SiteChromeProps = {
  children: React.ReactNode;
  showFooter?: boolean;
};

export async function SiteChrome({
  children,
  showFooter = true,
}: SiteChromeProps) {
  const session = await auth();

  return (
    <>
      <Header session={session} />
      <main className="flex-1">{children}</main>
      {showFooter ? <Footer /> : null}
    </>
  );
}
