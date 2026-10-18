import { env } from '@/config/env';

export { getCanonicalOrigin } from './canonical-origin';
import { getCanonicalOrigin } from './canonical-origin';

export function getSiteOrigin(
  origin: string = env.NEXT_PUBLIC_APP_URL,
): string {
  return origin.replace(/\/+$/, '');
}

export function normalizePath(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;
  const withoutHash = withoutQuery.split('#')[0] ?? withoutQuery;
  if (!withoutHash || withoutHash === '/') {
    return '/';
  }

  const withLeading = withoutHash.startsWith('/')
    ? withoutHash
    : `/${withoutHash}`;

  return withLeading.replace(/\/+$/, '') || '/';
}

export function toCanonicalUrl(
  path: string,
  origin: string = getCanonicalOrigin(),
): string {
  const base = getSiteOrigin(origin);
  const normalized = normalizePath(path);
  return normalized === '/' ? base : `${base}${normalized}`;
}

export function toAbsoluteAssetUrl(
  pathOrUrl: string,
  origin: string = getCanonicalOrigin(),
): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const base = getSiteOrigin(origin);
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function getOrganizationId(
  origin: string = getCanonicalOrigin(),
): string {
  return `${getSiteOrigin(origin)}/#organization`;
}

export function getWebsiteId(origin: string = getCanonicalOrigin()): string {
  return `${getSiteOrigin(origin)}/#website`;
}

export function getPersonId(origin: string = getCanonicalOrigin()): string {
  return `${getSiteOrigin(origin)}/#founder`;
}

export function getWebPageId(
  path: string,
  origin: string = getCanonicalOrigin(),
): string {
  return `${toCanonicalUrl(path, origin)}#webpage`;
}
