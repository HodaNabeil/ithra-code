'use client';

interface RatingLinkButtonProps {
  ratingsCount: number;
}

export default function RatingLinkButton({
  ratingsCount,
}: RatingLinkButtonProps) {
  return (
    <button
      onClick={() =>
        document
          .getElementById('course-reviews')
          ?.scrollIntoView({ behavior: 'smooth' })
      }
      className="text-foreground underline hover:opacity-80 transition-opacity cursor-pointer text-right"
    >
      ({ratingsCount.toLocaleString('en-EG')} التقييمات)
    </button>
  );
}
