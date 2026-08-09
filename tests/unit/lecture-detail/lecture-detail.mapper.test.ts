import { CourseStatus, LectureType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LectureDetailError } from '@/features/courses/lecture-detail/errors/lecture-detail.errors';
import {
  mapLectureDetailCourseToApiDTO,
  mapLectureToDTO,
} from '@/features/courses/lecture-detail/mapper/lecture-detail.mapper';
import type {
  DB_LectureDetailCourseEntity,
  DB_LectureDetailEntity,
} from '@/features/courses/lecture-detail/repository/lecture-detail.select';

vi.mock('@/lib/bunny-stream', () => ({
  isBunnyStreamConfigured: vi.fn(() => true),
  signBunnyHlsUrl: vi.fn(
    () => 'https://cdn.example.com/video/playlist.m3u8?token=abc',
  ),
}));

const baseDate = new Date('2026-01-01T00:00:00.000Z');

const courseEntity: DB_LectureDetailCourseEntity = {
  id: 'claaaaaaaaaaaaaaaaaaaaaa1',
  instructorId: 'claaaaaaaaaaaaaaaaaaaaaa2',
  title: 'Node.js Course',
  slug: 'nodejs-complete-guide',
  description: 'Course description',
  shortDescription: 'Short',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  previewVideo: null,
  price: 99.99 as unknown as DB_LectureDetailCourseEntity['price'],
  compareAtPrice: null,
  currency: 'EGP',
  level: 'BEGINNER',
  status: CourseStatus.PUBLISHED,
  visibility: 'PUBLIC',
  isFeatured: false,
  duration: 120,
  requirements: ['JS basics'],
  objectives: ['Learn Node'],
  targetAudience: ['Developers'],
  tags: ['nodejs'],
  metaTitle: null,
  metaDescription: null,
  certificateEnabled: true,
  maxStudents: null,
  pathId: 'claaaaaaaaaaaaaaaaaaaaaa3',
  createdAt: baseDate,
  updatedAt: baseDate,
  publishedAt: baseDate,
  reviews: [{ rating: 5 }, { rating: 4 }],
};

function buildLectureEntity(
  overrides: Partial<DB_LectureDetailEntity> = {},
): DB_LectureDetailEntity {
  return {
    id: 'claaaaaaaaaaaaaaaaaaaaaa0',
    sectionId: 'claaaaaaaaaaaaaaaaaaaaaa4',
    title: 'Lecture 1',
    description: 'Lecture description',
    type: LectureType.VIDEO,
    content: null,
    videoId: 'claaaaaaaaaaaaaaaaaaaaaa5',
    position: 1,
    isPublished: true,
    isFree: false,
    createdAt: baseDate,
    updatedAt: baseDate,
    video: {
      id: 'claaaaaaaaaaaaaaaaaaaaaa5',
      bunnyVideoId: 'bunny-1',
      libraryId: 'lib-1',
      status: 'ready',
    },
    section: {
      course: courseEntity,
    },
    ...overrides,
  };
}

describe('lecture-detail.mapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps lecture with signed HLS URL for ready video', async () => {
    const { isBunnyStreamConfigured, signBunnyHlsUrl } = await import(
      '@/lib/bunny-stream'
    );

    const dto = mapLectureToDTO(buildLectureEntity());

    expect(isBunnyStreamConfigured).toHaveBeenCalled();
    expect(signBunnyHlsUrl).toHaveBeenCalledWith({
      bunnyVideoId: 'bunny-1',
      libraryId: 'lib-1',
    });
    expect(dto.videoHlsUrl).toBe(
      'https://cdn.example.com/video/playlist.m3u8?token=abc',
    );
    expect(dto).toMatchObject({
      id: 'claaaaaaaaaaaaaaaaaaaaaa0',
      sectionId: 'claaaaaaaaaaaaaaaaaaaaaa4',
      videoId: 'claaaaaaaaaaaaaaaaaaaaaa5',
      isPublished: true,
      isFree: false,
    });
    expect(dto).not.toHaveProperty('attachments');
    expect(dto).not.toHaveProperty('progress');
  });

  it('returns null videoHlsUrl for processing video', async () => {
    const dto = mapLectureToDTO(
      buildLectureEntity({
        video: {
          id: 'claaaaaaaaaaaaaaaaaaaaaa5',
          bunnyVideoId: 'bunny-1',
          libraryId: 'lib-1',
          status: 'processing',
        },
      }),
    );

    expect(dto.videoHlsUrl).toBeNull();
  });

  it('returns null videoHlsUrl for non-video lecture', () => {
    const dto = mapLectureToDTO(
      buildLectureEntity({
        type: LectureType.TEXT,
        videoId: null,
        video: null,
      }),
    );

    expect(dto.videoHlsUrl).toBeNull();
  });

  it('throws 500 when Bunny signing fails for ready video', async () => {
    const { signBunnyHlsUrl } = await import('@/lib/bunny-stream');
    vi.mocked(signBunnyHlsUrl).mockReturnValueOnce(null);

    try {
      mapLectureToDTO(buildLectureEntity());
      expect.fail('expected LectureDetailError');
    } catch (error) {
      expect(error).toBeInstanceOf(LectureDetailError);
      expect((error as LectureDetailError).status).toBe(500);
      expect((error as LectureDetailError).message).toBe(
        'Bunny/CDN signing configuration error',
      );
    }
  });

  it('maps course with empty sections and lecturesCount zero', () => {
    const dto = mapLectureDetailCourseToApiDTO(courseEntity, true);

    expect(dto.sections).toEqual([]);
    expect(dto.lecturesCount).toBe(0);
    expect(dto.isInCart).toBe(false);
    expect(dto.isPurchased).toBe(true);
    expect(dto.rating).toBe(4.5);
    expect(dto.ratingCount).toBe(2);
    expect(dto.objectives).toEqual(['Learn Node']);
    expect(dto.tags).toEqual(['nodejs']);
  });
});
