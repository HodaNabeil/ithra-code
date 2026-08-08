import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>مرحباً يا Admin: {session.user.name}</div>
      <Link
        href="/admin/analytics/ai"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        تحليلات استخدام AI
      </Link>
    </div>
  );
}
