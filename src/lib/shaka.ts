/**
 * Shared Shaka Player helpers used by both the React `VideoPlayer` and the
 * out-of-React persistent session. Shaka ships its own types, but we model the
 * minimal surface we touch so the dynamic-import call sites stay strongly typed
 * regardless of how the UI build's declarations resolve.
 */

export interface ShakaNetworkingEngine {
  registerRequestFilter(
    filter: (type: unknown, request: { uris: string[] }) => void,
  ): void;
}
export interface ShakaMediaTrack {
  height: number | null;
  active: boolean;
}
export interface ShakaPlayerInstance {
  attach(video: HTMLMediaElement): Promise<void>;
  load(uri: string, startTime?: number, mimeType?: string): Promise<void>;
  configure(config: { abr?: { enabled?: boolean } }): void;
  getNetworkingEngine(): ShakaNetworkingEngine | null;
  getVideoTracks(): ShakaMediaTrack[];
  getVariantTracks(): ShakaMediaTrack[];
  selectVideoTrack(track: ShakaMediaTrack, clearBuffer?: boolean): void;
  selectVariantTrack(track: ShakaMediaTrack, clearBuffer?: boolean): void;
  destroy(): Promise<void>;
}
export interface ShakaUIInstance {
  destroy(): Promise<void>;
}
export interface ShakaLib {
  polyfill: { installAll(): void };
  Player: new () => ShakaPlayerInstance;
  ui: {
    Overlay: new (
      player: ShakaPlayerInstance,
      container: HTMLElement,
      video: HTMLMediaElement,
    ) => ShakaUIInstance;
  };
}

/** Dynamically import Shaka's UI build (keeps it out of the SSR bundle) and install polyfills. */
export async function loadShakaUi(): Promise<ShakaLib> {
  const shaka = (await import('shaka-player/dist/shaka-player.ui'))
    .default as unknown as ShakaLib;
  shaka.polyfill.installAll();
  return shaka;
}

/** Pick a MIME type so Shaka selects the right path (HLS vs progressive file). */
export function inferSourceType(
  src: string,
): 'application/x-mpegurl' | 'video/mp4' | undefined {
  if (/\.m3u8(\?|$)/i.test(src)) return 'application/x-mpegurl';
  if (/\.mp4(\?|$)/i.test(src)) return 'video/mp4';
  return undefined;
}

/** Tracks with a numeric height, preferring an exact match then closest height. */
export function pickTrackByHeight<T extends { height: number | null }>(
  tracks: T[],
  targetHeight: number,
): T | null {
  const withHeight = tracks.filter(
    (t): t is T & { height: number } => typeof t.height === 'number',
  );
  if (withHeight.length === 0) return null;
  const exact = withHeight.find((t) => t.height === targetHeight);
  if (exact) return exact;
  return withHeight.reduce((best, t) =>
    Math.abs(t.height - targetHeight) < Math.abs(best.height - targetHeight)
      ? t
      : best,
  );
}

/** Apply default quality the same way Shaka's resolution menu does (v4.15+). */
export function applyDefaultQuality(
  player: ShakaPlayerInstance,
  targetHeight: number,
): void {
  const videoTrack = pickTrackByHeight(player.getVideoTracks(), targetHeight);
  const variantTrack =
    videoTrack == null
      ? pickTrackByHeight(player.getVariantTracks(), targetHeight)
      : null;

  const target = videoTrack ?? variantTrack;
  if (target == null) return;

  player.configure({ abr: { enabled: false } });
  // Skip selecting a track Shaka already activated during load(). With ABR off,
  // load() picks a default rendition and fetches its variant playlist + first
  // segment; re-selecting that same active track refetches both (the duplicate
  // network requests seen when the preview dialog first opens). clearBuffer also
  // stays false so a genuine switch doesn't refetch the first segment.
  if (target.active) return;
  if (videoTrack) {
    player.selectVideoTrack(videoTrack, false);
  } else if (variantTrack) {
    player.selectVariantTrack(variantTrack, false);
  }
}

/**
 * Bunny serves HLS from a token-protected pull zone. The signed master URL
 * carries ?token=&expires=&token_path= authorizing the whole /<videoId>/ folder,
 * but the relative variant-playlist and segment URLs resolve WITHOUT that query —
 * so those sub-requests reach Bunny unsigned and 403. This forwards the master's
 * query to every Bunny request that lacks it.
 */
export function registerSignedQueryForwarder(
  player: ShakaPlayerInstance,
  src: string,
): void {
  const signedQuery = src.includes('?') ? src.slice(src.indexOf('?') + 1) : '';
  if (!signedQuery) return;
  player.getNetworkingEngine()?.registerRequestFilter((_type, request) => {
    request.uris = request.uris.map((uri) =>
      /\.b-cdn\.net\//.test(uri) && !/[?&]token=/.test(uri)
        ? uri + (uri.includes('?') ? '&' : '?') + signedQuery
        : uri,
    );
  });
}
