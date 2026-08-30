import { describe, expect, it } from 'vitest';

import { EnrollmentValidationError } from '@/features/enrollments/application/errors/enrollment.errors';
import { parseEnrollmentListQuery } from '@/features/enrollments/api/validation/enrollment-list-query';

describe('parseEnrollmentListQuery', () => {
  it('applies defaults matching the curl contract', () => {
    expect(parseEnrollmentListQuery({})).toEqual({
      page: 1,
      limit: 10,
      search: undefined,
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
      status: undefined,
      progressState: undefined,
    });
  });

  it('rejects page = 0', () => {
    expect(() => parseEnrollmentListQuery({ page: '0' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects limit = 500', () => {
    expect(() => parseEnrollmentListQuery({ limit: '500' })).toThrow(
      EnrollmentValidationError,
    );
  });

  it('rejects an invalid sortBy', () => {
    expect(() => parseEnrollmentListQuery({ sortBy: 'price' })).toThrow(
      EnrollmentValidationError,
    );
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
      progressState: undefined,
    });
  });

  it('accepts progressState and sortBy=lastAccessedAt', () => {
    expect(
      parseEnrollmentListQuery({
        progressState: 'in_progress',
        sortBy: 'lastAccessedAt',
        sortOrder: 'desc',
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      search: undefined,
      sortBy: 'lastAccessedAt',
      sortOrder: 'desc',
      status: undefined,
      progressState: 'in_progress',
    });
  });

  it('rejects an invalid progressState', () => {
    expect(() =>
      parseEnrollmentListQuery({ progressState: 'half_done' }),
    ).toThrow(EnrollmentValidationError);
  });
});
