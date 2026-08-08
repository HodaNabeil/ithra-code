/** Next cache serialisation can turn Prisma `Date` fields into ISO strings. */
export function prismaDateToIso(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}

export function prismaDateToIsoNullable(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;
  return prismaDateToIso(value);
}

export function computeRating(reviews: { rating: number }[]): {
  rating: number;
  ratingCount: number;
} {
  const ratingCount = reviews.length;
  const rating =
    ratingCount > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / ratingCount
      : 0;

  return { rating, ratingCount };
}

export function formatInstructorName(
  firstName: string | null,
  lastName: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Instructor';
}
