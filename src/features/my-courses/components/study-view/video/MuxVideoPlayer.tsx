'use client';

import MuxPlayer from '@mux/mux-player-react';
import { toggleLectureCompletion } from '@/features/my-courses/actions/my-course';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/enums';

interface MuxVideoPlayerProps {
  playbackId: string;
  title: string;
  lectureId: string;
  courseSlug: string;
  nextLectureId?: string;
}

export const MuxVideoPlayer = ({
  playbackId,
  title,
  lectureId,
  courseSlug,
  nextLectureId,
}: MuxVideoPlayerProps) => {
  const router = useRouter();

  const onEnded = async () => {
    try {
      await toggleLectureCompletion(lectureId, true);
      toast.success('تم إكمال المحاضرة بنجاح');

      router.refresh();
      if (nextLectureId) {
        toast.info('جاري الانتقال للدرس التالي...');

        setTimeout(() => {
          router.push(
            `/${APP_ROUTES.MY_COURSES}/${courseSlug}/${APP_ROUTES.LEARN}/${APP_ROUTES.LECTURE}/${nextLectureId}`,
          );
        }, 2000);
      } else {
        toast('مبروك! لقد أتممت هذا القسم.');
      }
    } catch (error) {
      console.error('Error marking lecture as completed:', error);
      toast.error('فشل في تحديث حالة المحاضرة');
    }
  };

  return (
    <div className="h-[88vh] w-full bg-black overflow-hidden relative group  border-b border-white/5">
      <MuxPlayer
        playbackId={playbackId}
        metadataVideoTitle={title}
        accentColor="#ea580c"
        onEnded={onEnded}
        className="w-full h-full"
        streamType="on-demand"
        primaryColor="#FFFFFF"
      />
    </div>
  );
};
