import React from 'react';
import { Logo } from './Logo';
import { NavItems } from './NavItems';
import { UserNav } from './UserNav';
import { MobileMenu } from './MobileMenu';
import ShopingCartButton from './ShopingCartButton';
import { Session } from 'next-auth';
import { ThemeToggle } from './ThemeToggle';

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="container flex h-20 items-center justify-between">
        <Logo />

        <div className="flex items-center gap-4">
          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 justify-center px-4">
            <NavItems session={session} />
          </div>

          {/* User Navigation - Hidden on mobile */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ShopingCartButton />

            <div className="hidden lg:flex items-center gap-4">
              <UserNav session={session} />
            </div>
          </div>

          {/* Mobile Menu - Only visible on mobile */}
          <div className="block lg:hidden">
            <MobileMenu session={session} />
          </div>
        </div>
      </div>
    </header>
  );
}
