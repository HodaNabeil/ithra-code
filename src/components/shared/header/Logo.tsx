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
        src="/img/ithracode.png"
        alt="IthraCode"
        width={1960}
        height={802}
        className={className ?? 'h-12 w-auto shrink-0 sm:h-14 lg:h-16'}
        priority
      />
    </Link>
  );
}
