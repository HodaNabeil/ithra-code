import { AttachmentType, LectureType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildProgressMap,
  mapCourseSectionsToDTO,
} from '@/features/courses/course-sections/mapper/course-sections.mapper';
import type { DB_CourseSectionsEntity } from '@/features/courses/course-sections/repository/course-sections.select';

vi.mock('@/lib/bunny-stream', () => ({
  signBunnyHlsUrl: vi.fn(
    () => 'https://cdn.example.com/video/playlist.m3u8?token=abc',
  ),
}));

const baseDate = new Date('2026-01-01T00:00:00.000Z');

function buildCourseEntity(
  overrides: Partial<DB_CourseSectionsEntity> = {},
): DB_CourseSectionsEntity {
  return {
    id: 'course-1',
    sections: [
      {
        id: 'section-1',
        courseId: 'course-1',
        title: 'Section 1',
        description: 'Intro',
        position: 1,
        isPublished: true,
        createdAt: baseDate,
        updatedAt: baseDate,
        lectures: [
          {
            id: 'lecture-1',
            title: 'Lecture 1',
            description: 'First lecture',
            type: LectureType.VIDEO,
            position: 1,
            isPublished: true,
            isFree: true,
            video: {
              id: 'video-1',
              bunnyVideoId: 'bunny-1',
              libraryId: 'lib-1',
              status: 'ready',
              duration: 600,
              thumbnailUrl: 'https://example.com/thumb.jpg',
              createdAt: baseDate,
              updatedAt: baseDate,
            },
            attachments: [
              {
                id: 'attachment-1',
                name: 'slides.pdf',
                type: AttachmentType.PDF,
                url: 'https://example.com/slides.pdf',
                isDownloadable: true,
                position: 0,
                createdAt: baseDate,
                updatedAt: baseDate,
              },
            ],
          },
          {
            id: 'lecture-2',
            title: 'Lecture 2',
            description: null,
            type: LectureType.TEXT,
            position: 2,
            isPublished: true,
            isFree: false,
            video: null,
            attachments: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('course-sections.mapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps sections with statistics from visible lectures', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: false,
    });

    expect(result.total).toBe(1);
    expect(result.sections[0]?.statistics).toEqual({
      totalLectures: 2,
      totalDuration: 600,
      completedLectures: 0,
    });
  });

  it('omits progress for non-enrolled mapping', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: false,
    });

    expect(result.sections[0]?.lectures[0]?.progress).toBeUndefined();
  });

  it('returns null progress for enrolled lectures without records', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: true,
    });

    expect(result.sections[0]?.lectures[0]?.progress).toBeNull();
  });

  it('maps existing progress and completed lecture statistics', () => {
    const progressByLectureId = buildProgressMap([
      {
        lectureId: 'lecture-1',
        isCompleted: true,
        timeSpent: 600,
        lastAccessedAt: baseDate,
        completedAt: baseDate,
      },
    ]);

    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId,
      includeProgress: true,
    });

    expect(result.sections[0]?.lectures[0]?.progress).toEqual({
      isCompleted: true,
      timeSpent: 600,
      lastAccessedAt: baseDate.toISOString(),
      completedAt: baseDate.toISOString(),
    });
    expect(result.sections[0]?.statistics.completedLectures).toBe(1);
  });

  it('excludes sectionId and lecture timestamps from lecture payload', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: false,
    });

    const lecture = result.sections[0]?.lectures[0];
    expect(lecture).toMatchObject({
      id: 'lecture-1',
      title: 'Lecture 1',
      videoDuration: 600,
      isPublished: true,
      isFree: true,
    });
    expect(lecture).not.toHaveProperty('sectionId');
    expect(lecture).not.toHaveProperty('createdAt');
    expect(lecture).not.toHaveProperty('updatedAt');
    expect(lecture).not.toHaveProperty('content');
  });

  it('attaches hlsUrl for ready videos', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: false,
    });

    expect(result.sections[0]?.lectures[0]?.video?.hlsUrl).toBe(
      'https://cdn.example.com/video/playlist.m3u8?token=abc',
    );
  });

  it('maps attachments correctly', () => {
    const result = mapCourseSectionsToDTO({
      course: buildCourseEntity(),
      progressByLectureId: new Map(),
      includeProgress: false,
    });

    expect(result.sections[0]?.lectures[0]?.attachments).toEqual([
      {
        id: 'attachment-1',
        name: 'slides.pdf',
        type: AttachmentType.PDF,
        url: 'https://example.com/slides.pdf',
        isDownloadable: true,
        position: 0,
        createdAt: baseDate.toISOString(),
        updatedAt: baseDate.toISOString(),
      },
    ]);
  });
});
