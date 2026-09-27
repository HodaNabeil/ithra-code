import { AuthBranding } from '@/features/auth/components/auth-branding';
import { AuthCard } from '@/features/auth/components/auth-card';

export default function Login() {
  return (
    <main>
      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-12">
          <AuthBranding />
          <AuthCard />
        </div>
      </div>
    </main>
  );
}
