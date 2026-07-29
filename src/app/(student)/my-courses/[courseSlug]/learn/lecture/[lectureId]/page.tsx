import { redirect } from 'next/navigation';

/** Redirect legacy /learn/lecture/ URLs to the canonical lecture route. */
export default async function LegacyLectureRedirect({
  params,
}: {
  params: Promise<{ courseSlug: string; lectureId: string }>;
}) {
  const { courseSlug, lectureId } = await params;
  redirect(`/my-courses/${courseSlug}/lecture/${lectureId}`);
}
