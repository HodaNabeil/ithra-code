import { SiteChrome } from '@/components/shared/layouts/site-chrome';

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
