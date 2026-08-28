import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { MY_COURSES_ROUTES } from '@/constants/my-courses';

export function CertificatesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="p-6 rounded-full bg-primary/10">
        <Award className="size-12 text-primary" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">لا توجد شهادات بعد</h2>
        <p className="text-muted-foreground">
          أكمل دوراتك للحصول على شهادات إتمام يمكنك مشاركتها مع الآخرين.
        </p>
      </div>
      <Button asChild className="rounded-full px-8 h-11 font-bold">
        <Link href={MY_COURSES_ROUTES.COURSES}>تصفح الدورات</Link>
      </Button>
    </div>
  );
}
