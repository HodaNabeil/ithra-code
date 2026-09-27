import Image from 'next/image';
import Link from 'next/link';

import { APP_ROUTES } from '@/constants/enums';

export function AuthBranding() {
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <Link
        href={APP_ROUTES.ROOT}
        className="transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        <Image
          src="/img/logo-ic.png"
          alt="IthraCode"
          width={160}
          height={160}
          className="h-14 w-auto sm:h-16"
          priority
        />
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        مرحبًا بعودتك
      </h1>
    </div>
  );
}
