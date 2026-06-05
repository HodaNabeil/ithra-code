import { Info } from 'lucide-react';

interface OverviewPanelProps {
  description: string;
  updatedAt?: Date;
}

export function OverviewPanel({ description, updatedAt }: OverviewPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
              <Info className="size-5 text-primary" />
              عن المحاضرة
            </h2>
            {updatedAt && (
              <span className="text-sm text-muted-foreground">
                آخر تحديث:{' '}
                {new Intl.DateTimeFormat('ar-EG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(updatedAt))}
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {description}
          </p>
        </section>
      </div>
    </div>
  );
}
