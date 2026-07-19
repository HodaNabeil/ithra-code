import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { APP_ROUTES } from '@/constants/enums';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href={APP_ROUTES.ROOT}>
      <Image
        src="/img/logo.png"
        alt="Logo"
        width={120}
        height={32}
        className={className}
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
    </Link>
  );
}
