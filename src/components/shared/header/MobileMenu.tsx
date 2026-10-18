'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { UserNav } from './UserNav';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Session } from 'next-auth';
import { filterNavLinks } from './nav-links';

export function MobileMenu({
  session: serverSession,
}: {
  session: Session | null;
}) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();
  const session = clientSession ?? serverSession;
  const [isOpen, setIsOpen] = useState(false);
  const filteredLinks = filterNavLinks(session);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex gap-4 items-center">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-primary" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-full max-w-none sm:max-w-none p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>القائمة</SheetTitle>
            <SheetDescription>روابط التصفح الرئيسية</SheetDescription>
          </SheetHeader>

          <nav className="px-10 py-20 h-full flex flex-col items-start gap-10">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={cn(
                  'block w-full text-base font-bold leading-tight transition-colors',
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-foreground/85 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <UserNav session={session} />
    </div>
  );
}
