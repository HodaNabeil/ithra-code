'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

import { Session } from 'next-auth';
import { AUTH_ROUTES } from '@/constants/auth';
import { DIRECTIONS } from '@/constants/i18n';
import { PROFILE_ROUTES, STUDENT_ROUTES } from '@/constants/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
export interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  rightElement?: React.ReactNode;
}

export interface MenuSection {
  items: MenuItem[];
}

export function UserNav({ session }: { session: Session | null }) {
  const user = session?.user;
  const handleLogout = () => signOut();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 px-3 has-[>svg]:px-2.5 rounded-md"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  // Generate user initials for fallback from available NextAuth fields.
  const getUserInitials = (name?: string | null, email?: string | null) => {
    const trimmedName = name?.trim();
    if (trimmedName) {
      const parts = trimmedName.split(/\s+/);
      const first = parts[0]?.[0] ?? '';
      const second = parts[1]?.[0] ?? '';
      return `${first}${second}`.toUpperCase() || 'م';
    }

    const emailInitial = email?.trim()?.[0];
    return emailInitial?.toUpperCase() || 'م';
  };
  const sections: MenuSection[] = [
    {
      items: [
        { label: 'لوحة التحكم', href: STUDENT_ROUTES.DASHBOARD },
        { label: 'إعدادات الحساب', href: PROFILE_ROUTES.EDIT },
      ],
    },
    {
      items: [
        {
          label: 'تسجيل الخروج',
          onClick: handleLogout,
          className: 'text-destructive focus:text-destructive',
        },
      ],
    },
  ];

  return (
    <DropdownMenu dir={DIRECTIONS.RTL}>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getUserInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 text-right [direction:rtl] bg-background"
        align="end"
        sideOffset={12}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name || 'User'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {user.name || 'مستخدم'}
                </p>
                <p
                  className="text-xs leading-none text-muted-foreground truncate pb-0.5 max-w-[150px] text-left"
                  dir={DIRECTIONS.LTR}
                >
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        {sections.map((section: MenuSection, sectionIndex: number) => (
          <React.Fragment key={sectionIndex}>
            <DropdownMenuSeparator />
            {section.items.map((item: MenuItem, itemIndex: number) => (
              <DropdownMenuItem
                key={itemIndex}
                asChild={!!item.href}
                className={`cursor-pointer transition-colors hover:bg-sidebar-accent data-[highlighted]:bg-sidebar-accent ${item.className || ''}`}
                onClick={item.onClick}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center justify-between w-full"
                  >
                    <span>{item.label}</span>
                    {item.rightElement}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.rightElement}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
