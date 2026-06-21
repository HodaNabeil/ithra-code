import { create } from 'zustand';

export interface PreviewVideo {
  id: string;
  title: string;
  /** 'embed' = HLS (.m3u8) stream played via video.js; 'video' = direct media file URL (mp4 etc.) */
  kind: 'embed' | 'video';
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

function previewSessionKey(videos: PreviewVideo[]): string {
  return videos.map((v) => v.id).join('|');
}

interface CoursePreviewStore {
  isOpen: boolean;
  courseTitle: string;
  videos: PreviewVideo[];
  activeVideoId: string | null;
  /** Set when preview opens; used to keep the player mounted after close. */
  preservedPreviewSessionKey: string | null;
  /** First-seen URL per video id so Shaka is not reset when signed URLs change. */
  pinnedPlayerSrcByVideoId: Record<string, string>;

  openPreview: (
    courseTitle: string,
    videos: PreviewVideo[],
    activeVideoId?: string,
  ) => void;
  closePreview: () => void;
  setActiveVideo: (id: string) => void;
}

function pinVideoSrc(
  pinned: Record<string, string>,
  video: PreviewVideo | undefined,
): Record<string, string> {
  if (!video?.url) return pinned;
  if (pinned[video.id]) return pinned;
  return { ...pinned, [video.id]: video.url };
}

export const useCoursePreviewStore = create<CoursePreviewStore>((set) => ({
  isOpen: false,
  courseTitle: '',
  videos: [],
  activeVideoId: null,
  preservedPreviewSessionKey: null,
  pinnedPlayerSrcByVideoId: {},

  openPreview: (courseTitle, videos, activeVideoId) =>
    set((state) => {
      const sessionKey = previewSessionKey(videos);
      const sameSession = state.preservedPreviewSessionKey === sessionKey;
      const nextActiveId = activeVideoId ?? videos[0]?.id ?? null;
      const activeVideo = videos.find((v) => v.id === nextActiveId);
      const pinned = sameSession ? state.pinnedPlayerSrcByVideoId : {};
      return {
        isOpen: true,
        courseTitle,
        videos,
        activeVideoId: nextActiveId,
        preservedPreviewSessionKey: sessionKey,
        pinnedPlayerSrcByVideoId: pinVideoSrc(pinned, activeVideo),
      };
    }),

  closePreview: () =>
    set({
      isOpen: false,
    }),

  setActiveVideo: (id) =>
    set((state) => {
      const video = state.videos.find((v) => v.id === id);
      return {
        activeVideoId: id,
        pinnedPlayerSrcByVideoId: pinVideoSrc(
          state.pinnedPlayerSrcByVideoId,
          video,
        ),
      };
    }),
}));
