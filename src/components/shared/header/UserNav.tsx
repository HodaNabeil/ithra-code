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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

import { Session } from 'next-auth';
import { AUTH_ROUTES } from '@/constants/auth';

export function UserNav({ session }: { session: Session | null }) {
  const user = session?.user;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className="text-accent transition-all duration-200 bg-primary hover:bg-primary/90 hover:text-accent rounded-3xl w-[100px] h-10 element-center"
        >
          تسجيل
        </Link>
      </div>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="outline-none">
        <Avatar
          className="h-9 w-9 cursor-pointer border border-zinc-700/50
         hover:border-primary/50 transition-all duration-300 shadow-md"
        >
          <AvatarImage
            src={user?.image ?? undefined}
            alt={user?.name || 'User'}
          />
          <AvatarFallback className="bg-primary/20 ">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-primary/20  backdrop-blur-xl border-primary/20  shadow-2xl"
        align="end"
      >
        <DropdownMenuLabel className="font-normal font-sans">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs ">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-primary/20" />

        <DropdownMenuItem className="focus:bg-primary/20 focus:text-primary cursor-pointer">
          <Link href="/dashboard" className="w-full">
            لوحة التحكم
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="focus:bg-primary/20 focus:text-primary cursor-pointer">
          <Link href="/profile" className="w-full">
            الملف الشخصي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="focus:bg-primary/20 focus:text-primary cursor-pointer">
          <Link href="/my-courses" className="w-full">
            دوراتي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-primary/20" />

        <DropdownMenuItem
          className="text-red-400 focus:bg-red-500/10 cursor-pointer"
          onClick={() => signOut()}
        >
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
