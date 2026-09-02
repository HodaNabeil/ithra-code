import { CourseStatus, LectureType, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mapGetLectureResponse,
  mapLectureToDTO,
} from '@/features/courses/lecture-detail/mapper/lecture-detail.mapper';
import type { DB_LectureDetailEntity } from '@/features/courses/lecture-detail/repository/lecture-detail.select';

const signBunnyHlsUrl = vi.fn();
const isBunnyStreamConfigured = vi.fn();

vi.mock('@/lib/bunny-stream', () => ({
  signBunnyHlsUrl: (...args: unknown[]) => signBunnyHlsUrl(...args),
  isBunnyStreamConfigured: () => isBunnyStreamConfigured(),
}));

function createVideoLecture(
  overrides: Partial<DB_LectureDetailEntity> = {},
): DB_LectureDetailEntity {
  return {
    id: 'clecture00000000000000001',
    sectionId: 'csection0000000000000001',
    title: 'Video Lecture',
    description: null,
    type: LectureType.VIDEO,
    content: null,
    videoId: 'cvideo00000000000000001',
    position: 1,
    isPublished: true,
    isFree: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    video: {
      id: 'cvideo00000000000000001',
      bunnyVideoId: 'bunny-1',
      libraryId: 'lib-1',
      status: 'ready',
    },
    section: {
      course: {
        id: 'ccourse00000000000000001',
        instructorId: 'cinstructor0000000000001',
        title: 'Course',
        slug: 'course',
        description: 'desc',
        shortDescription: null,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        previewVideo: null,
        price: new Prisma.Decimal(100),
        compareAtPrice: null,
        currency: 'USD',
        level: 'BEGINNER',
        status: CourseStatus.PUBLISHED,
        visibility: 'PUBLIC',
        isFeatured: false,
        duration: 60,
        requirements: [],
        objectives: [],
        targetAudience: [],
        tags: [],
        metaTitle: null,
        metaDescription: null,
        certificateEnabled: false,
        maxStudents: null,
        pathId: 'cpath000000000000000001',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    },
    ...overrides,
  };
}

describe('lecture-detail.mapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isBunnyStreamConfigured.mockReturnValue(true);
    signBunnyHlsUrl.mockReturnValue('https://cdn.example/playlist.m3u8?token=abc');
  });

  it('returns signed HLS URL for ready video when Bunny is configured', () => {
    const lecture = createVideoLecture();
    const dto = mapLectureToDTO(lecture);

    expect(dto.videoHlsUrl).toBe('https://cdn.example/playlist.m3u8?token=abc');
    expect(signBunnyHlsUrl).toHaveBeenCalledWith({
      bunnyVideoId: 'bunny-1',
      libraryId: 'lib-1',
    });
  });

  it('returns null videoHlsUrl when video is processing', () => {
    const lecture = createVideoLecture({
      video: {
        id: 'cvideo00000000000000001',
        bunnyVideoId: 'bunny-1',
        libraryId: 'lib-1',
        status: 'processing',
      },
    });

    expect(mapLectureToDTO(lecture).videoHlsUrl).toBeNull();
    expect(signBunnyHlsUrl).not.toHaveBeenCalled();
  });

  it('returns null videoHlsUrl when Bunny signing fails', () => {
    signBunnyHlsUrl.mockReturnValue(null);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const dto = mapLectureToDTO(createVideoLecture());

    expect(dto.videoHlsUrl).toBeNull();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('passes rating aggregate into course DTO', () => {
    const lecture = createVideoLecture();
    const response = mapGetLectureResponse({
      lecture,
      course: lecture.section!.course,
      ratingAggregate: { rating: 4.2, ratingCount: 5 },
      hasPurchased: true,
      hasRated: true,
    });

    expect(response.course.rating).toBe(4.2);
    expect(response.course.ratingCount).toBe(5);
    expect(response.hasPurchased).toBe(true);
    expect(response.hasRated).toBe(true);
  });
});
