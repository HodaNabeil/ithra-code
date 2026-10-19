'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Link } from '../link';
import type { Session } from 'next-auth';
import { filterNavLinks } from './nav-links';

export function NavItems({
  session: serverSession,
}: {
  session: Session | null;
}) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  const filteredLinks = filterNavLinks(session);

  return (
    <nav className="flex items-center gap-8">
      {filteredLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'site-header-nav-link text-base font-bold hover:text-white',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
