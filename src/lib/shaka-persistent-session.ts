/**
 * Keeps one Shaka player + media element alive across React unmounts (e.g. Radix dialog close).
 * Used by course preview so reopening the dialog does not re-fetch HLS manifests/segments.
 */

import {
  applyDefaultQuality,
  inferSourceType,
  loadShakaUi,
  registerSignedQueryForwarder,
  type ShakaPlayerInstance,
  type ShakaUIInstance,
} from '@/lib/shaka';

export type { ShakaPlayerInstance } from '@/lib/shaka';

const PERSIST_HOLDER_ID = '__shaka_persistent_holder__';

export interface PersistentShakaEntry {
  instanceKey: string;
  src: string;
  wrapper: HTMLDivElement;
  video: HTMLVideoElement;
  player: ShakaPlayerInstance;
  ui: ShakaUIInstance;
}

let activeEntry: PersistentShakaEntry | null = null;

/**
 * Serializes every session mutation (create/destroy). Each operation chains onto
 * the previous one so create and destroy can never overlap — even when two
 * acquires arrive with *different* keys (e.g. quick video switches or React
 * Strict Mode double-mount), which would otherwise both create/destroy the
 * shared `activeEntry` concurrently.
 */
let opChain: Promise<unknown> = Promise.resolve();

function enqueue<T>(op: () => Promise<T>): Promise<T> {
  const next = opChain.then(op, op);
  // Keep the chain alive regardless of whether `op` resolved or rejected.
  opChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function ensurePersistHolder(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('Persistent Shaka is browser-only');
  }
  let holder = document.getElementById(PERSIST_HOLDER_ID);
  if (!holder) {
    holder = document.createElement('div');
    holder.id = PERSIST_HOLDER_ID;
    holder.className =
      'fixed size-px overflow-hidden opacity-0 pointer-events-none';
    holder.setAttribute('aria-hidden', 'true');
    document.body.appendChild(holder);
  }
  return holder;
}

async function destroyEntry(entry: PersistentShakaEntry): Promise<void> {
  await entry.ui.destroy().catch(() => {});
  await entry.player.destroy().catch(() => {});
  entry.wrapper.remove();
}

async function createPersistentShakaSession(
  instanceKey: string,
  src: string,
  defaultQualityHeight: number,
): Promise<PersistentShakaEntry> {
  if (activeEntry) {
    await destroyEntry(activeEntry);
    activeEntry = null;
  }

  const shaka = await loadShakaUi();

  const wrapper = document.createElement('div');
  wrapper.className = 'relative isolate size-full bg-black';
  wrapper.dir = 'ltr';

  const video = document.createElement('video');
  video.className = 'absolute inset-0 size-full';
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  wrapper.appendChild(video);

  const player = new shaka.Player();
  await player.attach(video);
  const ui = new shaka.ui.Overlay(player, wrapper, video);

  registerSignedQueryForwarder(player, src);

  player.configure({ abr: { enabled: false } });
  await player.load(src, undefined, inferSourceType(src));
  applyDefaultQuality(player, defaultQualityHeight);

  const entry: PersistentShakaEntry = {
    instanceKey,
    src,
    wrapper,
    video,
    player,
    ui,
  };

  activeEntry = entry;
  ensurePersistHolder().appendChild(wrapper);
  return entry;
}

export async function acquirePersistentShakaSession(
  instanceKey: string,
  src: string,
  defaultQualityHeight: number,
): Promise<PersistentShakaEntry> {
  // Fast path: the requested session is already live, no need to queue.
  if (activeEntry?.instanceKey === instanceKey && activeEntry.src === src) {
    return activeEntry;
  }

  return enqueue(() => {
    // Re-check inside the chain: an earlier queued op may have created exactly
    // this session while we were waiting.
    if (activeEntry?.instanceKey === instanceKey && activeEntry.src === src) {
      return Promise.resolve(activeEntry);
    }
    return createPersistentShakaSession(instanceKey, src, defaultQualityHeight);
  });
}

export function attachPersistentShakaToHost(host: HTMLElement): void {
  if (!activeEntry) return;
  host.replaceChildren(activeEntry.wrapper);
}

export function detachPersistentShakaFromHost(): void {
  if (!activeEntry?.wrapper.parentElement) return;
  ensurePersistHolder().appendChild(activeEntry.wrapper);
}

export async function destroyPersistentShakaSession(): Promise<void> {
  await enqueue(async () => {
    if (!activeEntry) return;
    const entry = activeEntry;
    activeEntry = null;
    await destroyEntry(entry);
  });
}

export function getPersistentShakaVideo(): HTMLVideoElement | null {
  return activeEntry?.video ?? null;
}
