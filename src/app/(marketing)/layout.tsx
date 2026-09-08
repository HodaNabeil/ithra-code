import { SiteChrome } from '@/components/shared/layouts/site-chrome';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
