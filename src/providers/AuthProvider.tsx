'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { GuestCartSync } from '@/features/cart/components/GuestCartSync';

type AuthProviderProps = {
  children: React.ReactNode;
  session?: Session | null;
};

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <GuestCartSync />
      {children}
    </SessionProvider>
  );
}
