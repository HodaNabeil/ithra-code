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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react'; // Or your custom signout logic
import Link from 'next/link';

interface UserNavClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserNavClient({ user }: UserNavClientProps) {
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="outline-none focus:ring-0">
        <Avatar className="h-9 w-9 cursor-pointer border border-border hover:border-primary/50 transition-all duration-300 shadow-md">
          <AvatarFallback className="bg-muted text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
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

        {/* Note: Use 'asChild' on DropdownMenuItem when putting a Link inside */}
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
