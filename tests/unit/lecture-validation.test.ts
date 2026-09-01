import { describe, expect, it } from 'vitest';

import {
  assertLectureBelongsToCourse,
  lectureExistsInCourse,
} from '@/features/ai-tutor/application/services/lecture-validation.service';
import { AskTutorError } from '@/features/ai-tutor/application/errors/ask-tutor.errors';
import type { EnrolledCourseWithProgressDTO } from '@/features/ai-tutor/domain/ports/CourseContextRepositoryPort';

const course: EnrolledCourseWithProgressDTO = {
  id: 'course-1',
  slug: 'course-slug',
  title: 'Course',
  description: 'desc',
  shortDescription: null,
  level: 'beginner',
  objectives: [],
  requirements: [],
  knowledgeIndexedAt: null,
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      position: 1,
      lectures: [
        {
          id: 'lecture-1',
          title: 'Lecture 1',
          description: null,
          type: 'video',
          position: 1,
        },
      ],
    },
  ],
  enrollments: [],
};

describe('lecture validation', () => {
  it('allows omitted lectureId', () => {
    expect(() => assertLectureBelongsToCourse(undefined, course)).not.toThrow();
  });

  it('allows lecture in enrolled course', () => {
    expect(lectureExistsInCourse(course, 'lecture-1')).toBe(true);
    expect(() =>
      assertLectureBelongsToCourse('lecture-1', course),
    ).not.toThrow();
  });

  it('rejects foreign lectureId', () => {
    expect(() =>
      assertLectureBelongsToCourse('lecture-foreign', course),
    ).toThrow(AskTutorError);
  });
});
