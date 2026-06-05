'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { APP_LINK_ROLES, APP_ROUTES, APP_USER_ROLES } from '@/constant/enums';
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

const NAV_LINKS = [
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
    role: APP_LINK_ROLES.STUDENT,
  },
  {
    label: 'Admin',
    href: APP_ROUTES.ADMIN,
    role: APP_LINK_ROLES.ADMIN,
  },
];

export function MobileMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [isOpen, setIsOpen] = useState(false);

  const filteredLinks = NAV_LINKS.filter((link) => {
    if (link.role === APP_LINK_ROLES.ALL) return true;
    if (link.role === APP_LINK_ROLES.ADMIN && userRole === APP_USER_ROLES.ADMIN)
      return true;
    if (link.role === APP_LINK_ROLES.STUDENT && session?.user) return true;
    return false;
  });

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
                  'block w-full text-base font-medium leading-tight transition-colors',
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
