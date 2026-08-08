'use client';

import { useMemo, useState } from 'react';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/shared/video-player';
import type { Course } from '@/types/course/course.types';
import { useCoursePreviewStore } from '../stores/course-preview-store';
import { buildFreePreviewVideosFromSections } from '../utils/build-free-preview-videos';

interface CourseVideoPreviewProps {
  title: string;
  thumbnailUrl?: string | null;
  sections: Course['sections'];
  previewVideoUrl?: string | null;
  className?: string;
  /**
   * 'auto' (default): plays inline when only one preview exists, otherwise opens the dialog.
   * 'dialog': always opens the shared preview dialog.
   */
  mode?: 'auto' | 'dialog';
}

export function CourseVideoPreview({
  title,
  thumbnailUrl,
  sections,
  previewVideoUrl,
  className,
  mode = 'auto',
}: CourseVideoPreviewProps) {
  const { openPreview } = useCoursePreviewStore();
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  const previewVideos = useMemo(
    () =>
      buildFreePreviewVideosFromSections(sections, {
        previewVideoUrl,
        courseTitle: title,
        courseThumbnailUrl: thumbnailUrl ?? null,
      }),
    [sections, previewVideoUrl, title, thumbnailUrl],
  );

  const first = previewVideos[0];
  const hasPreviews = previewVideos.length > 0;
  const singlePreview = previewVideos.length === 1 && Boolean(first?.url);

  function handleActivatePreview() {
    if (!hasPreviews || !first) return;
    if (mode === 'auto' && singlePreview && first.url) {
      setIsPlayingInline(true);
      return;
    }
    openPreview(title, previewVideos, first.id);
  }

  if (isPlayingInline && singlePreview && first?.url) {
    return (
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden bg-black',
          className,
        )}
      >
        {first.kind === 'video' ? (
          <video
            key={first.id}
            src={first.url}
            poster={first.thumbnailUrl ?? thumbnailUrl ?? undefined}
            controls
            autoPlay
            playsInline
            className="size-full bg-black object-contain"
          />
        ) : (
          <VideoPlayer
            key={first.id}
            src={first.url}
            poster={first.thumbnailUrl ?? thumbnailUrl ?? undefined}
            autoPlay
            className="size-full"
          />
        )}

        <button
          type="button"
          onClick={() => setIsPlayingInline(false)}
          className="absolute top-2 end-2 z-20 flex size-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          aria-label="إغلاق المعاينة"
        >
          <X className="size-5 shrink-0" />
        </button>
      </div>
    );
  }

  const rootClass = cn(
    'relative aspect-video w-full bg-muted flex items-center justify-center lg:border-b border-sidebar-border overflow-hidden',
    hasPreviews ? 'group cursor-pointer' : 'cursor-default',
    className,
  );

  if (!hasPreviews) {
    return (
      <div className={rootClass} aria-label={title}>
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleActivatePreview}
      className={rootClass}
      aria-label="معاينة هذه الدورة"
    >
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/60" />

      <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-accent shadow-lg transition-transform group-hover:scale-110 dark:bg-foreground">
        <Play className="ms-0.5 size-5 fill-foreground text-primary dark:fill-accent" />
      </div>

      <div className="absolute bottom-4 z-10 text-sm font-semibold text-accent dark:text-foreground">
        معاينة هذه الدورة
      </div>
    </button>
  );
}
