'use client';

import { useEffect, useRef } from 'react';
import 'shaka-player/dist/controls.css';
import {
  acquirePersistentShakaSession,
  attachPersistentShakaToHost,
  detachPersistentShakaFromHost,
  getPersistentShakaVideo,
} from '@/lib/shaka-persistent-session';
import {
  applyDefaultQuality,
  inferSourceType,
  loadShakaUi,
  registerSignedQueryForwarder,
  type ShakaPlayerInstance,
  type ShakaUIInstance,
} from '@/lib/shaka';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
  /** Media URL to play (HLS `.m3u8` or a direct file URL) */
  src?: string;
  /**
   * Stable identity for the player instance (e.g. lecture id).
   * Prefer this over URL-based keys when signed URLs change between opens.
   */
  instanceKey?: string;
  poster?: string;
  autoPlay?: boolean;
  /**
   * When false, pauses playback without destroying the player (e.g. a closed dialog).
   * Defaults to true.
   */
  playbackActive?: boolean;
  className?: string;
  /** Fired when the video finishes playing; receives seconds watched since the last progress report */
  onEnded?: (incrementSeconds: number) => void;
  /** Fired periodically (and on navigate-away) with seconds watched since the last report */
  onProgress?: (incrementSeconds: number) => void;
  /** Preferred video height on load in pixels; closest rendition is chosen (default 720) */
  defaultQualityHeight?: number;
  /**
   * Reuse one Shaka instance across unmounts (requires `instanceKey`).
   * For modal previews that close without tearing down the stream.
   */
  persistPlayback?: boolean;
}

/** How often to flush accumulated watch time to the progress callback */
const REPORT_INTERVAL_MS = 30000;
/** Max seconds a single timeupdate tick may contribute (filters seeks / throttled tabs) */
const MAX_TICK_SECONDS = 1.5;

interface ShakaPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  playbackActive: boolean;
  className?: string;
  defaultQualityHeight: number;
  onEnded?: (incrementSeconds: number) => void;
  onProgress?: (incrementSeconds: number) => void;
}

/** Shaka surface that survives React unmount (e.g. dialog close). */
function PersistentShakaSurface({
  instanceKey,
  src,
  poster,
  autoPlay,
  playbackActive,
  className,
  defaultQualityHeight,
}: ShakaPlayerProps & { instanceKey: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playbackActiveRef = useRef(playbackActive);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => {
    playbackActiveRef.current = playbackActive;
    autoPlayRef.current = autoPlay;
  }, [playbackActive, autoPlay]);

  const attemptPlay = () => {
    const video = getPersistentShakaVideo();
    if (!video || !playbackActiveRef.current || !autoPlayRef.current) return;
    // Defer until after layout so play works when the dialog was `hidden`.
    requestAnimationFrame(() => {
      void video.play().catch(() => {});
    });
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    acquirePersistentShakaSession(instanceKey, src, defaultQualityHeight)
      .then(() => {
        if (cancelled) return;
        attachPersistentShakaToHost(host);
        attemptPlay();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      detachPersistentShakaFromHost();
    };
  }, [instanceKey, src, defaultQualityHeight]);

  useEffect(() => {
    const video = getPersistentShakaVideo();
    if (!video) return;
    video.poster = poster ?? '';
  }, [poster]);

  useEffect(() => {
    const video = getPersistentShakaVideo();
    if (!video) return;
    if (playbackActive && autoPlay) {
      attemptPlay();
    } else {
      video.pause();
    }
  }, [playbackActive, autoPlay]);

  return (
    <div
      ref={hostRef}
      dir="ltr"
      className={cn('relative isolate w-full bg-black aspect-video', className)}
    />
  );
}

/**
 * Mount with `instanceKey` (or `src`) from the parent so the player and
 * watch-time trackers reset cleanly when the source changes.
 */
function ShakaPlayer({
  src,
  poster,
  autoPlay,
  playbackActive,
  className,
  defaultQualityHeight,
  onEnded,
  onProgress,
}: ShakaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Last playback position seen via timeupdate (null = don't count next delta, e.g. after a seek)
  const lastSecondsRef = useRef<number | null>(null);
  // Fractional seconds watched but not yet reported
  const unreportedRef = useRef(0);
  // Always keep latest callbacks in refs so the player listeners never go stale
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playbackActive) {
      if (autoPlay) void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playbackActive, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let cancelled = false;
    // Shaka instances are created asynchronously; hold them so cleanup can run
    // even if it fires before setup resolves.
    let player: ShakaPlayerInstance | null = null;
    let ui: ShakaUIInstance | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    // Report whole accumulated seconds, keeping the fractional remainder
    const flushProgress = () => {
      const whole = Math.floor(unreportedRef.current);
      if (whole >= 1) {
        unreportedRef.current -= whole;
        onProgressRef.current?.(whole);
      }
    };

    const handleTimeUpdate = () => {
      const seconds = video.currentTime;
      if (typeof seconds !== 'number') return;
      if (lastSecondsRef.current != null) {
        const delta = seconds - lastSecondsRef.current;
        if (delta > 0 && delta < MAX_TICK_SECONDS) {
          unreportedRef.current += delta;
        }
      }
      lastSecondsRef.current = seconds;
    };

    // Don't count the jump introduced by a seek
    const handleSeekBoundary = () => {
      lastSecondsRef.current = null;
    };

    const handleEnded = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      const remaining = Math.round(unreportedRef.current);
      unreportedRef.current = 0;
      // Always fire so the lecture is marked complete, even if remaining rounds to 0
      onEndedRef.current?.(remaining);
    };

    async function setup() {
      // Dynamic import keeps Shaka (which touches `window`/`document`) out of the
      // SSR bundle; this effect only runs in the browser.
      const shaka = await loadShakaUi();
      if (cancelled || !video || !container) return;

      player = new shaka.Player();
      await player.attach(video);
      if (cancelled) return;

      // Shaka mounts its built-in control UI into the container element.
      ui = new shaka.ui.Overlay(player, container, video);

      registerSignedQueryForwarder(player, src);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('seeking', handleSeekBoundary);
      video.addEventListener('seeked', handleSeekBoundary);
      video.addEventListener('ended', handleEnded);
      interval = setInterval(flushProgress, REPORT_INTERVAL_MS);

      // Disable ABR before load so adaptive logic does not pick 1080p first.
      player.configure({ abr: { enabled: false } });

      await player.load(src, undefined, inferSourceType(src));
      if (cancelled) return;

      // Select 720p (Shaka 4.15+ video-track API) so the UI shows "720p", not "Auto".
      applyDefaultQuality(player, defaultQualityHeight);

      if (autoPlay) {
        await video.play().catch(() => {});
      }
    }

    setup().catch(() => {});

    return () => {
      cancelled = true;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      // Capture partial watch time when navigating away mid-video
      flushProgress();
      unreportedRef.current = 0;

      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeekBoundary);
      video.removeEventListener('seeked', handleSeekBoundary);
      video.removeEventListener('ended', handleEnded);

      // Destroy the UI before the player it wraps.
      ui?.destroy().catch(() => {});
      player?.destroy().catch(() => {});
    };
  }, [src, autoPlay, defaultQualityHeight]);

  return (
    <div
      ref={containerRef}
      // Force LTR so Shaka's built-in controls lay out left-to-right even though
      // the surrounding app is RTL.
      dir="ltr"
      className={cn('relative isolate w-full bg-black aspect-video', className)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full"
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        crossOrigin="anonymous"
      />
    </div>
  );
}

export function VideoPlayer({
  src,
  instanceKey,
  poster,
  autoPlay = false,
  playbackActive = true,
  className,
  defaultQualityHeight = 720,
  persistPlayback = false,
  onEnded,
  onProgress,
}: VideoPlayerProps) {
  const videoSrc = src?.trim() ?? '';
  const playerKey = instanceKey ?? videoSrc;

  if (persistPlayback && instanceKey && videoSrc) {
    return (
      <PersistentShakaSurface
        instanceKey={instanceKey}
        src={videoSrc}
        poster={poster}
        autoPlay={autoPlay}
        playbackActive={playbackActive}
        className={className}
        defaultQualityHeight={defaultQualityHeight}
      />
    );
  }

  if (!videoSrc) {
    return (
      <div
        className={cn(
          'relative w-full overflow-hidden bg-black aspect-video flex items-center justify-center px-4 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        لا يتوفر مصدر تشغيل للفيديو.
      </div>
    );
  }

  return (
    <ShakaPlayer
      key={playerKey}
      src={videoSrc}
      poster={poster}
      autoPlay={autoPlay}
      playbackActive={playbackActive}
      className={className}
      defaultQualityHeight={defaultQualityHeight}
      onEnded={onEnded}
      onProgress={onProgress}
    />
  );
}
