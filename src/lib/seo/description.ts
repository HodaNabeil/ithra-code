import { SEO_META_DESCRIPTION_MAX_LENGTH } from './config';

export function toMetaDescription(
  value: string | null | undefined,
  maxLength: number = SEO_META_DESCRIPTION_MAX_LENGTH,
): string {
  if (value == null) {
    return '';
  }

  const withoutTags = String(value).replace(/<[^>]*>/g, ' ');
  const collapsed = withoutTags.replace(/\s+/g, ' ').trim();

  if (!collapsed) {
    return '';
  }

  if (collapsed.length <= maxLength) {
    return collapsed;
  }

  const truncated = collapsed.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  const cut =
    lastSpace > Math.floor(maxLength * 0.6)
      ? truncated.slice(0, lastSpace)
      : truncated;

  return `${cut.replace(/[.,;:!?،؛-]+$/u, '')}…`;
}
