import { createHash } from 'crypto';

import { env } from '@/config/env';

const HLS_TOKEN_TTL_SECONDS = 3600;

type SignBunnyHlsUrlInput = {
  bunnyVideoId: string;
  libraryId: string;
};

export function isBunnyStreamConfigured(): boolean {
  return Boolean(
    env.BUNNY_STREAM_CDN_HOSTNAME && env.BUNNY_STREAM_TOKEN_AUTH_KEY,
  );
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function generateBunnyToken(
  securityKey: string,
  bunnyVideoId: string,
  expires: number,
): string {
  const hashableBase = `${securityKey}${bunnyVideoId}${expires}`;
  const hash = createHash('sha256').update(hashableBase).digest();
  return base64UrlEncode(hash);
}

export function signBunnyHlsUrl({
  bunnyVideoId,
  libraryId: _libraryId,
}: SignBunnyHlsUrlInput): string | null {
  if (!isBunnyStreamConfigured()) {
    return null;
  }

  try {
    const hostname = env.BUNNY_STREAM_CDN_HOSTNAME!;
    const securityKey = env.BUNNY_STREAM_TOKEN_AUTH_KEY!;
    const expires = Math.floor(Date.now() / 1000) + HLS_TOKEN_TTL_SECONDS;
    const token = generateBunnyToken(securityKey, bunnyVideoId, expires);
    const tokenPath = encodeURIComponent(`/${bunnyVideoId}/`);

    return `https://${hostname}/${bunnyVideoId}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${tokenPath}`;
  } catch (error) {
    console.warn('[BUNNY_STREAM_SIGN_HLS]', error);
    return null;
  }
}
