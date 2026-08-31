import { describe, expect, it } from 'vitest';

import { EnrollmentValidationError } from '@/features/enrollments/application/errors/enrollment.errors';
import {
  parseEnrollmentListQuery,
  parseEnrollmentListQueryFromSearchParams,
} from '@/features/enrollments/api/validation/enrollment-list-query';

describe('parseEnrollmentListQuery', () => {
  it('applies defaults matching the curl contract', () => {
    expect(parseEnrollmentListQuery({})).toEqual({
      page: 1,
      limit: 10,
      search: undefined,
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
      status: undefined,
    });
  });

  it('rejects page = 0', () => {
    expect(() => parseEnrollmentListQuery({ page: '0' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects limit = 0', () => {
    expect(() => parseEnrollmentListQuery({ limit: '0' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects limit = 500', () => {
    expect(() => parseEnrollmentListQuery({ limit: '500' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects limit = 101', () => {
    expect(() => parseEnrollmentListQuery({ limit: '101' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('accepts limit = 100', () => {
    expect(parseEnrollmentListQuery({ limit: '100' })).toMatchObject({
      limit: 100,
    });
  });

  it('rejects an invalid sortBy', () => {
    expect(() => parseEnrollmentListQuery({ sortBy: 'price' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects sortBy=lastAccessedAt', () => {
    expect(() =>
      parseEnrollmentListQuery({ sortBy: 'lastAccessedAt' }),
    ).toThrow(EnrollmentValidationError);
  });

  it('rejects an invalid sortOrder', () => {
    expect(() => parseEnrollmentListQuery({ sortOrder: 'up' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects DROPPED and REVOKED status filters', () => {
    expect(() => parseEnrollmentListQuery({ status: 'DROPPED' })).toThrow(
      EnrollmentValidationError,
    );
    expect(() => parseEnrollmentListQuery({ status: 'REVOKED' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('accepts ACTIVE status and trims search', () => {
    expect(
      parseEnrollmentListQuery({
        status: 'ACTIVE',
        search: '  JavaScript  ',
        sortBy: 'title',
        sortOrder: 'asc',
        page: '2',
        limit: '20',
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      search: 'JavaScript',
      sortBy: 'title',
      sortOrder: 'asc',
      status: 'ACTIVE',
    });
  });

  it('accepts COMPLETED status', () => {
    expect(parseEnrollmentListQuery({ status: 'COMPLETED' })).toMatchObject({
      status: 'COMPLETED',
    });
  });

  it('accepts enrolledAt asc and title desc sort', () => {
    expect(
      parseEnrollmentListQuery({
        sortBy: 'enrolledAt',
        sortOrder: 'asc',
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      search: undefined,
      sortBy: 'enrolledAt',
      sortOrder: 'asc',
      status: undefined,
    });

    expect(
      parseEnrollmentListQuery({
        sortBy: 'title',
        sortOrder: 'desc',
      }),
    ).toMatchObject({
      sortBy: 'title',
      sortOrder: 'desc',
    });
  });

  it('rejects progressState=completed', () => {
    expect(() =>
      parseEnrollmentListQuery({ progressState: 'completed' }),
    ).toThrow(EnrollmentValidationError);
  });

  it('rejects removed progressState values', () => {
    expect(() =>
      parseEnrollmentListQuery({ progressState: 'in_progress' }),
    ).toThrow(EnrollmentValidationError);
    expect(() =>
      parseEnrollmentListQuery({ progressState: 'not_started' }),
    ).toThrow(EnrollmentValidationError);
  });

  it('rejects an invalid progressState', () => {
    expect(() =>
      parseEnrollmentListQuery({ progressState: 'half_done' }),
    ).toThrow(EnrollmentValidationError);
  });

  it('parses all query params from URLSearchParams', () => {
    const searchParams = new URLSearchParams({
      page: '2',
      limit: '20',
      search: 'React',
      sortBy: 'title',
      sortOrder: 'asc',
      status: 'COMPLETED',
    });

    expect(parseEnrollmentListQueryFromSearchParams(searchParams)).toEqual({
      page: 2,
      limit: 20,
      search: 'React',
      sortBy: 'title',
      sortOrder: 'asc',
      status: 'COMPLETED',
    });
  });

  it('rejects progressState from URLSearchParams', () => {
    const searchParams = new URLSearchParams({
      progressState: 'completed',
    });

    expect(() => parseEnrollmentListQueryFromSearchParams(searchParams)).toThrow(
      EnrollmentValidationError,
    );
  });
});
