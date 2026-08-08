'use client';

import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { APP_ROUTES } from '@/constants/enums';
import { CourseProgress } from './CourseProgress';

interface CourseCardProps {
  id: string;
  title: string;
  slug: string;
  progress: number;
  instructor: string;
  thumbnail?: string | null;
  rating?: number;
  lastLectureId?: string;
}

export const CourseCardStudent = ({
  title,
  slug,
  progress,
  instructor,
  thumbnail,
  lastLectureId,
}: CourseCardProps) => {
  const watchUrl = lastLectureId
    ? `${APP_ROUTES.MY_COURSES}/${slug}/lecture/${lastLectureId}`
    : `${APP_ROUTES.MY_COURSES}/${slug}`;

  return (
    <li>
      <Link
        href={watchUrl}
        className="group block h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      >
        <div className="relative aspect-16/10 overflow-hidden">
          <Image
            src={thumbnail || '/placeholder-course.jpg'}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-10 h-10 bg-secondary/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <Play className="w-4 h-4 text-foreground fill-foreground ml-1" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Course Info */}
          <div className="mb-2">
            <h3 className="font-bold text-primary line-clamp-2 leading-snug text-lg truncate">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground font-medium truncate">
              {instructor}
            </p>
          </div>

          {/* Progress Section */}
          <CourseProgress progress={progress} />
        </CardContent>
      </Link>
    </li>
  );
};
