'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlayCircle, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { destroyPersistentShakaSession } from '@/lib/shaka-persistent-session';
import { formatVideoTimestamp } from '@/lib/formatters';
import { VideoPlayer } from '@/components/shared/video-player';
import { useCoursePreviewStore } from '../../stores/course-preview-store';

/** Pauses when inactive but stays mounted so the media buffer is kept. */
function DialogNativeVideo({
  active,
  className,
  poster,
  src,
}: {
  active: boolean;
  className?: string;
  poster?: string;
  src: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) {
      requestAnimationFrame(() => {
        void el.play().catch(() => {});
      });
    } else {
      el.pause();
    }
  }, [active]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls
      playsInline
      className={className}
    />
  );
}

export function CoursePreviewDialog() {
  const {
    isOpen,
    courseTitle,
    videos,
    activeVideoId,
    preservedPreviewSessionKey,
    pinnedPlayerSrcByVideoId,
    closePreview,
    setActiveVideo,
  } = useCoursePreviewStore();

  const activeVideo = videos.find((v) => v.id === activeVideoId) ?? videos[0];

  const previewCacheKey = useMemo(
    () => videos.map((v) => v.id).join('|'),
    [videos],
  );

  const keepPlayerMounted =
    preservedPreviewSessionKey === previewCacheKey && Boolean(activeVideo?.url);

  // Only native `<video>` needs the dialog force-mounted to keep its buffer alive
  // across close/reopen. HLS playback lives in an out-of-React holder
  // (see shaka-persistent-session), so it persists without force-mounting — which
  // avoids leaving a force-mounted dialog in the DOM when closed.
  const keepDialogForceMounted =
    keepPlayerMounted && activeVideo?.kind === 'video';

  const playerSrc = useMemo(() => {
    if (!activeVideo?.url) return null;
    return pinnedPlayerSrcByVideoId[activeVideo.id] ?? activeVideo.url;
  }, [activeVideo?.id, activeVideo?.url, pinnedPlayerSrcByVideoId]);

  useEffect(() => {
    if (
      preservedPreviewSessionKey != null &&
      preservedPreviewSessionKey !== previewCacheKey
    ) {
      void destroyPersistentShakaSession();
    }
  }, [preservedPreviewSessionKey, previewCacheKey]);

  useEffect(() => {
    return () => {
      void destroyPersistentShakaSession();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent
        forceMount={keepDialogForceMounted || undefined}
        dir="rtl"
        // Keep the inherited grid display and size to content (max-h caps it).
        // The old `flex flex-col` + `h-fit` gave the body an indefinite height,
        // which iOS Safari collapsed (see the body wrappers below).
        className="w-[95vw] sm:max-w-2xl max-h-[90dvh] rounded-2xl overflow-hidden p-0 gap-0"
      >
        <div className="p-5 pb-4 border-b border-border">
          <DialogHeader>
            <span className="text-xs md:text-sm text-right text-muted-foreground font-normal block">
              معاينة الدورة
            </span>
            <DialogTitle className="text-base md:text-xl font-bold text-foreground text-right leading-relaxed line-clamp-2">
              {courseTitle}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* No `flex-1`/`min-h-0` here: those only get a usable height when the
            dialog itself has a definite height. With the dialog sized to content
            (grid), WebKit resolved them to 0 and the whole body — player and
            playlist — collapsed, leaving only the header (the iOS bug). Sizing to
            content + a viewport-capped playlist scroll avoids that. */}
        <div className="flex flex-col overflow-hidden">
          <div className="shrink-0 flex flex-col bg-background">
            <div className="w-full aspect-video overflow-hidden">
              {keepPlayerMounted && activeVideo && playerSrc ? (
                activeVideo.kind === 'video' ? (
                  <DialogNativeVideo
                    key={activeVideo.id}
                    active={isOpen}
                    src={playerSrc}
                    poster={activeVideo.thumbnailUrl ?? undefined}
                    className="w-full h-full bg-black object-contain"
                  />
                ) : (
                  <VideoPlayer
                    instanceKey={activeVideo.id}
                    src={playerSrc}
                    poster={activeVideo.thumbnailUrl ?? undefined}
                    autoPlay
                    playbackActive={isOpen}
                    persistPlayback
                    className="w-full h-full"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 bg-black">
                  لا يوجد فيديو متاح
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col border-t border-border bg-sidebar-background">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-sidebar-foreground text-right">
                مقاطع فيديو تجريبية مجانية:
              </p>
            </div>

            <div className="max-h-[40vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {videos.map((video) => {
                const isActive = video.id === activeVideoId;
                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideo(video.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-right border-b border-border transition-colors',
                      'hover:bg-sidebar-accent',
                      isActive && 'bg-primary/10 border-r-2 border-r-primary',
                    )}
                  >
                    <div className="shrink-0 w-10 h-10 rounded bg-sidebar-accent flex items-center justify-center overflow-hidden">
                      <MonitorPlay
                        className={cn(
                          'w-5 h-5',
                          isActive
                            ? 'text-primary'
                            : 'text-sidebar-foreground/60',
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-medium leading-snug line-clamp-2',
                          isActive ? 'text-primary' : 'text-sidebar-foreground',
                        )}
                      >
                        {video.title}
                      </p>
                      {video.duration != null && (
                        <p className="text-xs text-sidebar-foreground/50 mt-0.5 flex items-center gap-1">
                          <PlayCircle className="w-3 h-3 shrink-0" />
                          {formatVideoTimestamp(video.duration)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
