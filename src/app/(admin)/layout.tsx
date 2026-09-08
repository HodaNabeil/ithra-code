import { SiteChrome } from '@/components/shared/layouts/site-chrome';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome showFooter={false}>{children}</SiteChrome>;
}
