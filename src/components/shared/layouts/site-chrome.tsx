import Footer from '@/components/shared/footer';
import { Header } from '@/components/shared/header/header';
import { getAuthSession } from '@/lib/get-auth-session';

type SiteChromeProps = {
  children: React.ReactNode;
  showFooter?: boolean;
};

export async function SiteChrome({
  children,
  showFooter = true,
}: SiteChromeProps) {
  const session = await getAuthSession();

  return (
    <>
      <Header session={session} />
      <main className="flex-1">{children}</main>
      {showFooter ? <Footer /> : null}
    </>
  );
}
