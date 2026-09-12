import { Clock } from 'lucide-react';

import { Link } from '@/components/shared/link';
import { Button } from '@/components/ui/button';
import { PUBLIC_ROUTES } from '@/constants/routes';

type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({
  title,
  description = 'نعمل على هذه الصفحة وستكون متاحة قريباً.',
}: ComingSoonProps) {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
      <div className="flex max-w-md flex-col items-center space-y-6">
        <div className="rounded-full bg-primary/10 p-6">
          <Clock className="size-12 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-2xl font-semibold text-primary">قريباً</p>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Button asChild className="h-11 rounded-full px-8 font-bold">
          <Link href={PUBLIC_ROUTES.HOME}>العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
