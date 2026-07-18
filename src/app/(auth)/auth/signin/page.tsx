import { AuthCard } from '@/features/auth/components/AuthCard';
import { cn } from '@/lib/utils';

export default function Login() {
  return (
    <main>
      <div className={cn('h-[calc(100vh-(68.8px+104px))]', 'element-center')}>
        <AuthCard />
      </div>
    </main>
  );
}
