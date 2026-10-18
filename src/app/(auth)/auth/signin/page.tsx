import { Suspense } from 'react';
import { AuthBranding } from '@/features/auth/components/auth-branding';
import { AuthCard } from '@/features/auth/components/auth-card';
import { getConfiguredSocialAuthProviders } from '@/features/auth/lib/auth-providers';

export default function Login() {
  const providers = getConfiguredSocialAuthProviders();

  return (
    <main>
      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-12">
          <AuthBranding />
          <Suspense fallback={null}>
            <AuthCard providers={providers} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
