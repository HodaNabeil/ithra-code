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
import { UserAvatar } from './user-avatar';

export function UserNav({ session }: { session: Session | null }) {
  const user = session?.user;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className="text-base font-bold text-accent transition-all duration-200 bg-primary hover:bg-primary/90 hover:text-accent rounded-3xl w-[100px] h-10 element-center"
        >
          تسجيل
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="outline-none">
        <UserAvatar
          name={user.name}
          email={user.email}
          image={user.image}
          className="cursor-pointer transition-all duration-300 hover:ring-primary/60"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-card/95 text-card-foreground backdrop-blur-sm"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal font-sans">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer focus:bg-foreground/10 focus:text-foreground data-highlighted:bg-foreground/10 data-highlighted:text-foreground">
          <Link href="/dashboard" className="w-full">
            لوحة التحكم
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer focus:bg-foreground/10 focus:text-foreground data-highlighted:bg-foreground/10 data-highlighted:text-foreground">
          <Link href="/profile" className="w-full">
            الملف الشخصي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer focus:bg-foreground/10 focus:text-foreground data-highlighted:bg-foreground/10 data-highlighted:text-foreground">
          <Link href="/my-courses" className="w-full">
            دوراتي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
          onClick={() => signOut()}
        >
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
