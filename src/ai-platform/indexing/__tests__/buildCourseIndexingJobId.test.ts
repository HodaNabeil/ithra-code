import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCourseIndexingJobId } from '@/ai-platform/indexing/constants';

describe('buildCourseIndexingJobId', () => {
  it('uses contentVersion for course-scoped jobs', () => {
    const jobId = buildCourseIndexingJobId({
      scope: 'course',
      courseId: 'course-1',
      contentVersion: '2026-07-30T12:00:00.000Z',
    });

    assert.equal(jobId, 'index-course_course-1_2026-07-30T12_00_00_000Z');
  });

  it('uses lecture id and contentVersion for lecture-scoped jobs', () => {
    const jobId = buildCourseIndexingJobId({
      scope: 'lecture',
      courseId: 'course-1',
      lectureId: 'lecture-1',
      contentVersion: '2026-07-30T12:30:00.000Z',
    });

    assert.equal(jobId, 'index-lecture_lecture-1_2026-07-30T12_30_00_000Z');
  });

  it('produces identical job ids for the same content version', () => {
    const request = {
      scope: 'course' as const,
      courseId: 'course-1',
      contentVersion: '2026-07-30T12:00:00.000Z',
    };

    assert.equal(
      buildCourseIndexingJobId(request),
      buildCourseIndexingJobId(request),
    );
  });

  it('produces different job ids when content version changes', () => {
    const base = {
      scope: 'course' as const,
      courseId: 'course-1',
    };

    const first = buildCourseIndexingJobId({
      ...base,
      contentVersion: '2026-07-30T12:00:00.000Z',
    });
    const second = buildCourseIndexingJobId({
      ...base,
      contentVersion: '2026-07-30T13:00:00.000Z',
    });

    assert.notEqual(first, second);
  });
});
