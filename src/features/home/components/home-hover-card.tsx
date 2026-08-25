'use client';

import dynamic from 'next/dynamic';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AddToCartCourse } from '@/features/courses/components/add-to-cart-button';

const AddToCartButton = dynamic(
  () =>
    import('@/features/courses/components/add-to-cart-button').then((mod) => ({
      default: mod.AddToCartButton,
    })),
  {
    loading: () => <Skeleton className="h-12 w-full rounded-3xl" />,
  },
);

interface HomeHoverCardProps {
  objectives: string[];
  course: AddToCartCourse;
}

export function HomeHoverCard({ objectives, course }: HomeHoverCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h4 className="font-bold text-lg text-right">ما ستتعلمه</h4>
        <ul className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {objectives.slice(0, 5).map((objective, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug">
                {objective}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2">
        <AddToCartButton course={course} className="w-full" size="xl" />
      </div>
    </div>
  );
}
