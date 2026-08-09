import { createHash } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = {
  BUNNY_STREAM_CDN_HOSTNAME: undefined as string | undefined,
  BUNNY_STREAM_TOKEN_AUTH_KEY: undefined as string | undefined,
};

vi.mock('@/config/env', () => ({
  env: mockEnv,
}));

import {
  isBunnyStreamConfigured,
  signBunnyHlsUrl,
} from '@/lib/bunny-stream';

describe('bunny-stream', () => {
  beforeEach(() => {
    mockEnv.BUNNY_STREAM_CDN_HOSTNAME = undefined;
    mockEnv.BUNNY_STREAM_TOKEN_AUTH_KEY = undefined;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports not configured when env vars are missing', () => {
    expect(isBunnyStreamConfigured()).toBe(false);
    expect(
      signBunnyHlsUrl({
        bunnyVideoId: 'video-1',
        libraryId: 'lib-1',
      }),
    ).toBeNull();
  });

  it('generates a signed HLS URL when configured', () => {
    mockEnv.BUNNY_STREAM_CDN_HOSTNAME = 'vz-test.b-cdn.net';
    mockEnv.BUNNY_STREAM_TOKEN_AUTH_KEY = 'test-security-key';

    const bunnyVideoId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const url = signBunnyHlsUrl({
      bunnyVideoId,
      libraryId: '12345',
    });

    expect(url).toBeTruthy();
    expect(url).toContain('https://vz-test.b-cdn.net/');
    expect(url).toContain('/playlist.m3u8?');
    expect(url).toContain('token=');
    expect(url).toContain('expires=');
    expect(url).toContain('token_path=');
  });

  it('uses Bunny token signing algorithm', () => {
    mockEnv.BUNNY_STREAM_CDN_HOSTNAME = 'vz-test.b-cdn.net';
    mockEnv.BUNNY_STREAM_TOKEN_AUTH_KEY = 'test-security-key';

    const bunnyVideoId = 'video-guid';
    const expires = 1_700_000_000;
    const hashableBase = `test-security-key${bunnyVideoId}${expires}`;
    const expectedToken = createHash('sha256')
      .update(hashableBase)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    vi.spyOn(Date, 'now').mockReturnValue((expires - 3600) * 1000);

    const url = signBunnyHlsUrl({
      bunnyVideoId,
      libraryId: '12345',
    });

    expect(url).toContain(`token=${expectedToken}`);
    expect(url).toContain(`expires=${expires}`);
  });

  it('returns null and logs warning when signing fails', () => {
    mockEnv.BUNNY_STREAM_CDN_HOSTNAME = 'vz-test.b-cdn.net';
    mockEnv.BUNNY_STREAM_TOKEN_AUTH_KEY = 'test-security-key';

    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('clock failure');
    });

    const url = signBunnyHlsUrl({
      bunnyVideoId: 'video-1',
      libraryId: 'lib-1',
    });

    expect(url).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});
