import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PathListDTO } from '@/types/path/path.dto';

import { LearningPathCard } from '../learning-path-card';

interface LearningPathsListProps {
  paths: PathListDTO[];
}

export function LearningPathsList({ paths }: LearningPathsListProps) {
  if (paths.length === 0) {
    return (
      <div
        className={cn(
          'text-center',
          'py-20',
          'rounded-2xl',
          'border',
          'border-dashed',
          'border-muted-foreground/20',
        )}
      >
        <div className={cn('flex', 'justify-center', 'mb-4')}>
          <Info className={cn('h-12', 'w-12', 'text-muted-foreground/60')} />
        </div>
        <h3 className={cn('text-xl', 'font-semibold', 'mb-2')}>
          لا توجد مسارات تعليمية
        </h3>
        <p className={cn('text-muted-foreground', 'text-lg')}>
          لم يتم إضافة أي مسارات تعليمية بعد. يرجى العودة لاحقاً.
        </p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        'mx-auto grid max-w-[calc(350px*3)] grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {paths.map((path) => (
        <LearningPathCard key={path.id} path={path} />
      ))}
    </ul>
  );
}
