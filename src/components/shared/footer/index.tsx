import Link from 'next/link';
import SocialLinks from './social-links';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib';
import { PUBLIC_ROUTES } from '@/constants/routes';

export default function Footer() {
  return (
    <footer className="py-6">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm font-medium">
          <span>© IthraCode</span>
        </p>
        <SocialLinks />
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href={PUBLIC_ROUTES.ABOUT}
            className={cn(buttonVariants({ variant: 'link' }), 'px-0')}
          >
            من نحن
          </Link>
          <Link
            href={PUBLIC_ROUTES.PRIVACY}
            className={cn(buttonVariants({ variant: 'link' }), 'px-0')}
          >
            سياسة الخصوصية
          </Link>
          <Link
            href={PUBLIC_ROUTES.TERMS}
            className={cn(buttonVariants({ variant: 'link' }), 'px-0')}
          >
            شروط الاستخدام
          </Link>
        </div>
      </div>
    </footer>
  );
}
