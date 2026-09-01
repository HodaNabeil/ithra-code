import { signBunnyHlsUrl } from '@/lib/bunny-stream';
import {
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';
import type {
  AttachmentDTO,
  CourseSectionsProgressRecord,
  GetCourseSectionsResponse,
  LectureDTO,
  LectureProgressDTO,
  SectionWithStatsDTO,
  VideoDTO,
} from '../dto/course-sections.dto';
import type { DB_CourseSectionsEntity } from '../repository/course-sections.select';

type MapCourseSectionsInput = {
  course: DB_CourseSectionsEntity;
  progressByLectureId: Map<string, CourseSectionsProgressRecord>;
  includeProgress: boolean;
};

function mapAttachments(
  attachments: DB_CourseSectionsEntity['sections'][number]['lectures'][number]['attachments'],
): AttachmentDTO[] {
  return (attachments ?? []).map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    url: attachment.url,
    isDownloadable: attachment.isDownloadable,
    position: attachment.position,
    createdAt: prismaDateToIso(attachment.createdAt),
    updatedAt: prismaDateToIso(attachment.updatedAt),
  }));
}

function mapVideo(
  video: NonNullable<
    DB_CourseSectionsEntity['sections'][number]['lectures'][number]['video']
  >,
): VideoDTO {
  const base: VideoDTO = {
    id: video.id,
    bunnyVideoId: video.bunnyVideoId,
    libraryId: video.libraryId,
    status: video.status,
    duration: video.duration,
    thumbnailUrl: video.thumbnailUrl,
    createdAt: prismaDateToIso(video.createdAt),
    updatedAt: prismaDateToIso(video.updatedAt),
  };

  if (video.status === 'ready') {
    const hlsUrl = signBunnyHlsUrl({
      bunnyVideoId: video.bunnyVideoId,
      libraryId: video.libraryId,
    });

    if (hlsUrl) {
      base.hlsUrl = hlsUrl;
    }
  }

  return base;
}

function mapProgress(
  record: CourseSectionsProgressRecord | undefined,
): LectureProgressDTO | null {
  if (!record) return null;

  return {
    isCompleted: record.isCompleted,
    timeSpent: record.timeSpent,
    lastAccessedAt: prismaDateToIso(record.lastAccessedAt),
    completedAt: prismaDateToIsoNullable(record.completedAt),
  };
}

function mapLecture(
  lecture: DB_CourseSectionsEntity['sections'][number]['lectures'][number],
  progressByLectureId: Map<string, CourseSectionsProgressRecord>,
  includeProgress: boolean,
): LectureDTO {
  const dto: LectureDTO = {
    id: lecture.id,
    title: lecture.title,
    description: lecture.description,
    type: lecture.type,
    videoDuration: lecture.video?.duration ?? null,
    position: lecture.position,
    isPublished: lecture.isPublished,
    isFree: lecture.isFree,
    attachments: mapAttachments(lecture.attachments),
  };

  if (lecture.video) {
    dto.video = mapVideo(lecture.video);
  }

  if (includeProgress) {
    dto.progress = mapProgress(progressByLectureId.get(lecture.id));
  }

  return dto;
}

function computeStatistics(
  lectures: LectureDTO[],
  includeProgress: boolean,
): SectionWithStatsDTO['statistics'] {
  const totalLectures = lectures.length;
  const totalDuration = lectures.reduce(
    (sum, lecture) => sum + (lecture.videoDuration ?? 0),
    0,
  );
  const completedLectures = includeProgress
    ? lectures.filter((lecture) => lecture.progress?.isCompleted === true)
        .length
    : 0;

  return {
    totalLectures,
    totalDuration,
    completedLectures,
  };
}

export function mapCourseSectionsToDTO({
  course,
  progressByLectureId,
  includeProgress,
}: MapCourseSectionsInput): GetCourseSectionsResponse {
  const sections: SectionWithStatsDTO[] = (course.sections ?? []).map(
    (section) => {
      const lectures = (section.lectures ?? []).map((lecture) =>
        mapLecture(lecture, progressByLectureId, includeProgress),
      );

      return {
        id: section.id,
        courseId: section.courseId,
        title: section.title,
        description: section.description,
        position: section.position,
        isPublished: section.isPublished,
        createdAt: prismaDateToIso(section.createdAt),
        updatedAt: prismaDateToIso(section.updatedAt),
        lectures,
        statistics: computeStatistics(lectures, includeProgress),
      };
    },
  );

  return {
    sections,
    total: sections.length,
  };
}

export function buildProgressMap(
  records: CourseSectionsProgressRecord[],
): Map<string, CourseSectionsProgressRecord> {
  return new Map(records.map((record) => [record.lectureId, record]));
}
