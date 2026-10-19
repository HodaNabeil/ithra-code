import React from 'react';
import { Logo } from './logo';
import { NavItems } from './nav-items';
import { UserNav } from './user-nav';
import { MobileMenu } from './mobile-menu';
import ShoppingCartButton from './shopping-cart-button';
import { Session } from 'next-auth';

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="site-header sticky top-0 z-50 w-full text-base flex  h-17">
      <div className="container h-full">
        {/* Mobile & small screens: centered logo with independent side controls */}
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center lg:hidden">
          <div className="flex items-center justify-start">
            <ShoppingCartButton />
          </div>

          <div className="flex items-center justify-center px-2">
            <Logo />
          </div>

          <div className="flex items-center justify-end">
            <div className="block">
              <MobileMenu session={session} />
            </div>
          </div>
        </div>

        {/* Desktop & large screens: preserve existing header layout */}
        <div className="hidden h-full items-center justify-between lg:flex">
          <Logo />

          <div className="flex items-center gap-4">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden flex-1 justify-center px-4 lg:flex">
              <NavItems session={session} />
            </div>

            {/* User Navigation - Hidden on mobile */}
            <div className="flex items-center gap-4">
              <ShoppingCartButton />

              <div className="hidden items-center gap-4 lg:flex">
                <UserNav session={session} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
