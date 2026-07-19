import { auth } from '@/lib/auth'; // Path to your auth.ts file
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { AUTH_ROUTES } from '@/constants/auth';
import { UserNavClient } from './UserNavClient';

export default async function UserNav() {
  const session = await auth();

  // If no session exists, render the "Start" (Sign In) button server-side
  if (!session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <Menu className="text-primary cursor-pointer transition-colors" />
        </div>

        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          ابدأ
        </Link>
      </div>
    );
  }

  // If session exists, pass the user data to the client component for the dropdown
  return <UserNavClient user={session.user} />;
}
