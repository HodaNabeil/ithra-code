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
        alt="ithracode"
        width={1260}
        height={1260}
        className={className ?? 'h-9 w-auto'}
        priority
      />
    </Link>
  );
}
