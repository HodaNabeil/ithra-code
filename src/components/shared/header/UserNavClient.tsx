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
import { UserAvatar } from './user-avatar';

interface UserNavClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserNavClient({ user }: UserNavClientProps) {
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="outline-none focus:ring-0">
        <UserAvatar
          name={user.name}
          email={user.email}
          image={user.image}
          className="cursor-pointer transition-all duration-300 hover:ring-primary/60"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-background/95 backdrop-blur-xl border-border text-foreground shadow-2xl"
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          asChild
          className="focus:bg-accent focus:text-primary cursor-pointer"
        >
          <Link href="/dashboard" className="w-full">
            لوحة التحكم
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="focus:bg-accent focus:text-primary cursor-pointer"
        >
          <Link href="/profile" className="w-full">
            الملف الشخصي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="focus:bg-accent focus:text-primary cursor-pointer"
        >
          <Link href="/my-courses" className="w-full">
            دوراتي
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

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
