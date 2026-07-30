import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CourseStatus } from '@prisma/client';

import {
  publishCourseUseCase,
  publishLectureUseCase,
  type PublishCourseUseCaseDeps,
} from '@/features/courses/use-cases/publish-course.use-case';
import { PublishCourseError } from '@/features/courses/errors/publish-course.errors';
import type {
  CourseKnowledgeIndexerPort,
  CourseKnowledgeIndexingRequest,
} from '@/features/courses/application/ports/course-knowledge-indexer.port';
import type {
  PublishableCourseRepository,
  PublishableLectureRepository,
  LecturePublishRecord,
} from '@/features/courses/repositories/publishable-course.repository';
import type { CourseRecord } from '@/features/courses/types/course-record.types';

function createCourseRecord(overrides: Partial<CourseRecord> = {}): CourseRecord {
  const now = new Date('2026-07-30T10:00:00.000Z');
  return {
    id: overrides.id ?? 'course-1',
    slug: overrides.slug ?? 'intro-to-ts',
    title: overrides.title ?? 'Intro to TS',
    status: overrides.status ?? CourseStatus.DRAFT,
    instructorId: overrides.instructorId ?? 'instructor-1',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createLectureRecord(
  overrides: Partial<LecturePublishRecord> = {},
): LecturePublishRecord {
  const now = new Date('2026-07-30T11:00:00.000Z');
  return {
    id: overrides.id ?? 'lecture-1',
    sectionId: overrides.sectionId ?? 'section-1',
    isPublished: overrides.isPublished ?? false,
    updatedAt: overrides.updatedAt ?? now,
    course: overrides.course ?? {
      id: 'course-1',
      slug: 'intro-to-ts',
      status: CourseStatus.PUBLISHED,
      instructorId: 'instructor-1',
    },
  };
}

function createDeps(options: {
  course?: CourseRecord | null;
  publishedCourse?: CourseRecord;
  lecture?: LecturePublishRecord | null;
  publishedLecture?: LecturePublishRecord;
  indexer?: CourseKnowledgeIndexerPort;
}): PublishCourseUseCaseDeps {
  const courseRepository: PublishableCourseRepository = {
    async findByIdOrSlug() {
      return options.course ?? null;
    },
    async publish(id: string) {
      return (
        options.publishedCourse ?? {
          ...createCourseRecord({ id, status: CourseStatus.PUBLISHED }),
          updatedAt: new Date('2026-07-30T12:00:00.000Z'),
        }
      );
    },
  };

  const lectureRepository: PublishableLectureRepository = {
    async findById() {
      return options.lecture ?? null;
    },
    async publish(lectureId: string) {
      return (
        options.publishedLecture ?? {
          ...createLectureRecord({ id: lectureId, isPublished: true }),
          updatedAt: new Date('2026-07-30T12:30:00.000Z'),
        }
      );
    },
  };

  const scheduled: CourseKnowledgeIndexingRequest[] = [];
  const courseKnowledgeIndexer: CourseKnowledgeIndexerPort = options.indexer ?? {
    async scheduleIndexing(request) {
      scheduled.push(request);
    },
  };

  return {
    courseRepository,
    lectureRepository,
    courseKnowledgeIndexer,
    cacheInvalidator: {
      async invalidateAfterCoursePublish() {},
      async invalidateAfterLecturePublish() {},
    },
  };
}

describe('publish course indexing integration', () => {
  it('successful publish triggers course-scoped indexing', async () => {
    const scheduled: CourseKnowledgeIndexingRequest[] = [];
    const deps = createDeps({
      course: createCourseRecord(),
      indexer: {
        async scheduleIndexing(request) {
          scheduled.push(request);
        },
      },
    });

    const result = await publishCourseUseCase(
      {
        idOrSlug: 'intro-to-ts',
        user: { id: 'instructor-1', role: 'INSTRUCTOR' },
      },
      deps,
    );

    assert.equal(result.published, true);
    assert.equal(result.alreadyPublished, false);
    assert.equal(scheduled.length, 1);
    assert.equal(scheduled[0]?.scope, 'course');
    assert.equal(scheduled[0]?.courseSlug, 'intro-to-ts');
    assert.equal(scheduled[0]?.lectureId, undefined);
  });

  it('indexing failure handling does not fail publish', async () => {
    const deps = createDeps({
      course: createCourseRecord(),
      indexer: {
        async scheduleIndexing() {
          throw new Error('redis unavailable');
        },
      },
    });

    const result = await publishCourseUseCase(
      {
        idOrSlug: 'intro-to-ts',
        user: { id: 'instructor-1', role: 'INSTRUCTOR' },
      },
      deps,
    );

    assert.equal(result.published, true);
  });

  it('idempotent publish reuses published course and still schedules indexing', async () => {
    const scheduled: CourseKnowledgeIndexingRequest[] = [];
    const publishedCourse = createCourseRecord({
      status: CourseStatus.PUBLISHED,
      updatedAt: new Date('2026-07-30T12:00:00.000Z'),
    });

    const deps = createDeps({
      course: publishedCourse,
      indexer: {
        async scheduleIndexing(request) {
          scheduled.push(request);
        },
      },
    });

    const result = await publishCourseUseCase(
      {
        idOrSlug: 'intro-to-ts',
        user: { id: 'instructor-1', role: 'INSTRUCTOR' },
      },
      deps,
    );

    assert.equal(result.alreadyPublished, true);
    assert.equal(scheduled.length, 1);
    assert.equal(
      scheduled[0]?.contentVersion,
      publishedCourse.updatedAt.toISOString(),
    );
  });

  it('lecture publish schedules lecture-scoped indexing only', async () => {
    const scheduled: CourseKnowledgeIndexingRequest[] = [];
    const deps = createDeps({
      course: createCourseRecord({ status: CourseStatus.PUBLISHED }),
      lecture: createLectureRecord(),
      indexer: {
        async scheduleIndexing(request) {
          scheduled.push(request);
        },
      },
    });

    const result = await publishLectureUseCase(
      {
        courseIdOrSlug: 'intro-to-ts',
        lectureId: 'lecture-1',
        user: { id: 'instructor-1', role: 'INSTRUCTOR' },
      },
      deps,
    );

    assert.equal(result.published, true);
    assert.equal(scheduled.length, 1);
    assert.equal(scheduled[0]?.scope, 'lecture');
    assert.equal(scheduled[0]?.lectureId, 'lecture-1');
  });

  it('lecture publish is rejected when course is not published', async () => {
    const deps = createDeps({
      course: createCourseRecord({ status: CourseStatus.DRAFT }),
      lecture: createLectureRecord({
        course: {
          id: 'course-1',
          slug: 'intro-to-ts',
          status: CourseStatus.DRAFT,
          instructorId: 'instructor-1',
        },
      }),
    });

    await assert.rejects(
      () =>
        publishLectureUseCase(
          {
            courseIdOrSlug: 'intro-to-ts',
            lectureId: 'lecture-1',
            user: { id: 'instructor-1', role: 'INSTRUCTOR' },
          },
          deps,
        ),
      (error: unknown) => {
        assert.ok(error instanceof PublishCourseError);
        assert.equal(error.code, 'COURSE_NOT_PUBLISHED');
        return true;
      },
    );
  });
});

describe('course indexing runner', () => {
  it('lecture indexing processes only lecture resources incrementally', async () => {
    const { runLectureIndexing } = await import(
      '@/features/ai-tutor/application/services/course-indexing-runner.service'
    );
    const { CourseStatus, LectureType } = await import('@/generated/prisma/enums');

    const deletedSourceIds: string[] = [];
    const insertedCourseIds: string[] = [];
    const markedCourseIds: string[] = [];
    const hashes = new Map<string, string>();

    const course = {
      id: 'course-1',
      slug: 'intro-to-ts',
      title: 'Intro',
      description: 'Course description',
      shortDescription: null,
      objectives: [],
      status: CourseStatus.PUBLISHED,
      instructorId: 'instructor-1',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          lectures: [
            {
              id: 'lecture-1',
              title: 'Lecture 1',
              description: 'Published lecture content that is long enough to index.',
              content: null,
              type: LectureType.VIDEO,
              attachments: [],
              transcript: null,
            },
            {
              id: 'lecture-2',
              title: 'Lecture 2',
              description: 'Another lecture that should not be indexed in lecture scope.',
              content: null,
              type: LectureType.VIDEO,
              attachments: [],
              transcript: null,
            },
          ],
        },
      ],
    };

    const deps = {
      embeddingPort: {
        getDimensions() {
          return 1536;
        },
        async generateEmbedding() {
          throw new Error('not used');
        },
        async generateBatchEmbeddings(texts: string[]) {
          return {
            embeddings: texts.map((text) => ({
              text,
              embedding: Array.from({ length: 1536 }, () => 0.1),
              dimensions: 1536,
              model: 'test-embedding',
            })),
            totalTokensUsed: texts.length,
          };
        },
      },
      knowledgeChunkRepository: {
        async deleteByCourseId() {
          throw new Error('deleteByCourseId should not be called for lecture indexing');
        },
        async deleteByLectureId() {
          return 0;
        },
        async deleteBySourceId(sourceId: string) {
          deletedSourceIds.push(sourceId);
          return 1;
        },
        async deleteBySourceIds(sourceIds: string[]) {
          deletedSourceIds.push(...sourceIds);
          return sourceIds.length;
        },
        async countByCourseId() {
          return 0;
        },
        async insertMany(chunks: Array<{ courseId: string; lectureId?: string }>) {
          insertedCourseIds.push(chunks[0]?.courseId ?? '');
          assert.equal(chunks.every((chunk) => chunk.lectureId === 'lecture-1'), true);
        },
        async markCourseIndexed(courseId: string) {
          markedCourseIds.push(courseId);
        },
      },
      hashRepository: {
        async findBySourceId(sourceId: string) {
          const contentHash = hashes.get(sourceId);
          return contentHash
            ? {
                sourceId,
                courseId: 'course-1',
                lectureId: 'lecture-1',
                contentHash,
                updatedAt: new Date(),
              }
            : null;
        },
        async findByCourseId() {
          return [];
        },
        async findByLectureId() {
          return [];
        },
        async upsert(record: { sourceId: string; contentHash: string }) {
          hashes.set(record.sourceId, record.contentHash);
        },
        async deleteBySourceIds() {
          return 0;
        },
        async deleteByCourseId() {
          return 0;
        },
        async deleteByLectureId() {
          return 0;
        },
      },
      courseContentRepository: {
        async findPublishedCourseForIndexing() {
          return course;
        },
      },
    };

    const result = await runLectureIndexing(course, 'lecture-1', deps);

    assert.equal(result.chunksIndexed > 0, true);
    assert.ok(deletedSourceIds.length > 0);
    assert.deepEqual(markedCourseIds, ['course-1']);
    assert.equal(insertedCourseIds[0], 'course-1');
  });
});
