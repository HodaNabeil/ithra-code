/** Hero image wrapper: max-w-md (28rem) inside container grid md:2 cols, md:gap-12 */
export const HERO_IMAGE_SIZES =
  '(min-width: 1008px) 28rem, (min-width: 1024px) calc((100vw - 4rem - 3rem) / 2), (min-width: 768px) calc((100vw - 3rem - 3rem) / 2), (min-width: 640px) min(28rem, calc(100vw - 3rem)), min(28rem, calc(100vw - 2rem))';

/** Instructor card: max-w-5xl (64rem), image md:w-1/2 */
export const INSTRUCTOR_IMAGE_SIZES =
  '(min-width: 1024px) calc(min(calc(100vw - 4rem), 64rem) / 2), (min-width: 768px) calc(min(calc(100vw - 3rem), 64rem) / 2), (min-width: 640px) min(calc(100vw - 3rem), 64rem), min(calc(100vw - 2rem), 64rem)';

/** Featured courses grid: max-w-[calc(350px*3)], md:2 lg:3 cols, gap-8 */
export const FEATURED_COURSE_THUMBNAIL_SIZES =
  '(max-width: 639px) min(calc(100vw - 2rem), 1050px), (max-width: 767px) min(calc(100vw - 3rem), 1050px), (max-width: 1023px) calc((min(calc(100vw - 3rem), 1050px) - 2rem) / 2), calc((min(calc(100vw - 4rem), 1050px) - 4rem) / 3)';

/** Why section — per-card width fractions differ by breakpoint */
export const WHY_IMAGE_SIZES = [
  '(min-width: 1280px) calc(((100vw - 4rem - 2rem) / 2) * 5 / 6), (min-width: 1024px) calc((100vw - 4rem - 2rem) / 2), (min-width: 768px) calc((100vw - 3rem - 2rem) / 2), (min-width: 640px) calc((100vw - 3rem) * 5 / 6), calc((100vw - 2rem) * 5 / 6)',
  '(min-width: 1280px) calc(((100vw - 4rem - 2rem) / 2) * 3 / 5), (min-width: 1024px) calc((100vw - 4rem - 2rem) / 2), (min-width: 768px) calc((100vw - 3rem - 2rem) / 2), (min-width: 640px) calc((100vw - 3rem) * 5 / 6), calc((100vw - 2rem) * 5 / 6)',
  '(min-width: 1280px) calc(((100vw - 4rem - 2rem) / 2) * 2 / 5), (min-width: 1024px) calc(((100vw - 4rem - 2rem) / 2) * 4 / 6), (min-width: 768px) calc(((100vw - 3rem - 2rem) / 2) * 4 / 6), (min-width: 640px) calc((100vw - 3rem) * 3 / 5), calc((100vw - 2rem) * 3 / 5)',
  '(min-width: 1280px) calc(((100vw - 4rem - 2rem) / 2) * 2 / 5), (min-width: 1024px) calc(((100vw - 4rem - 2rem) / 2) * 4 / 6), (min-width: 768px) calc(((100vw - 3rem - 2rem) / 2) * 4 / 6), (min-width: 640px) calc((100vw - 3rem) * 3 / 5), calc((100vw - 2rem) * 3 / 5)',
] as const;
