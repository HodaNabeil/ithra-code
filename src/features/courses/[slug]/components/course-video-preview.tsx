'use client';

import { useMemo, useState } from 'react';
import { Play, X } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import { cn } from '@/lib/utils';
import type { SectionDTO } from '@/types/course/course.dto';

type PreviewItem = {
  id: string;
  url?: string;
  playbackId?: string;
};

function buildPreviewItems(
  sections: SectionDTO[],
  previewVideoUrl?: string | null,
): PreviewItem[] {
  const items: PreviewItem[] = [];

  if (previewVideoUrl) {
    items.push({ id: 'course-preview', url: previewVideoUrl });
  }

  for (const section of sections) {
    for (const lecture of section.lectures) {
      if (lecture.isFree && lecture.muxPlaybackId) {
        items.push({ id: lecture.id, playbackId: lecture.muxPlaybackId });
      }
    }
  }

  return items;
}

function isYoutubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function toYoutubeEmbedUrl(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

interface CourseVideoPreviewProps {
  title: string;
  thumbnailUrl?: string | null;
  sections: SectionDTO[];
  previewVideoUrl?: string | null;
  className?: string;
}

export function CourseVideoPreview({
  title,
  thumbnailUrl,
  sections,
  previewVideoUrl,
  className,
}: CourseVideoPreviewProps) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  const previewItems = useMemo(
    () => buildPreviewItems(sections, previewVideoUrl),
    [sections, previewVideoUrl],
  );

  const first = previewItems[0];
  const hasPreviews = previewItems.length > 0;

  if (isPlayingInline && first) {
    return (
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden bg-black',
          className,
        )}
      >
        {first.playbackId ? (
          <MuxPlayer
            key={first.id}
            playbackId={first.playbackId}
            metadataVideoTitle={title}
            accentColor="#ea580c"
            className="size-full"
            streamType="on-demand"
            autoPlay
          />
        ) : first.url && isYoutubeUrl(first.url) ? (
          <iframe
            key={first.id}
            src={toYoutubeEmbedUrl(first.url)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        ) : first.url ? (
          <video
            key={first.id}
            src={first.url}
            poster={thumbnailUrl ?? undefined}
            controls
            autoPlay
            playsInline
            className="size-full bg-black object-contain"
          />
        ) : null}

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
      onClick={() => setIsPlayingInline(true)}
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
