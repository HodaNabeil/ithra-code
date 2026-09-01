'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { APP_LINK_ROLES, APP_ROUTES, APP_USER_ROLES } from '@/constants/enums';
import { Link } from '../link';
import type { Session } from 'next-auth';

const NAV_LINKS: { label: string; href: string; role: string }[] = [
  {
    label: 'الدورات',
    href: APP_ROUTES.COURSES,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'مسارات التعلم',
    href: APP_ROUTES.LEARNING_PATHS,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'تواصل معنا',
    href: APP_ROUTES.CONTACT,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'دوراتي',
    href: APP_ROUTES.MY_COURSES,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'Admin',
    href: APP_ROUTES.ADMIN,
    role: APP_LINK_ROLES.ADMIN,
  },
];

export function NavItems({ session: serverSession }: { session: Session | null }) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  const userRole = session?.user?.role;

  const filteredLinks = NAV_LINKS.filter((link) => {
    if (link.role === APP_LINK_ROLES.ALL) return true;
    if (link.role === APP_LINK_ROLES.ADMIN && userRole === APP_USER_ROLES.ADMIN)
      return true;
    if (link.role === APP_LINK_ROLES.STUDENT && session?.user) return true;
    // Show for any logged in user? or specifically students?
    return false;
  });

  return (
    <nav className="flex items-center gap-8">
      {filteredLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'site-header-nav-link text-lg font-bold hover:text-white',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
