import { describe, expect, it } from 'vitest';

import { toMetaDescription } from './description';

describe('toMetaDescription', () => {
  it('returns an empty string for nullish values', () => {
    expect(toMetaDescription(null)).toBe('');
    expect(toMetaDescription(undefined)).toBe('');
  });

  it('strips HTML tags and collapses whitespace', () => {
    expect(
      toMetaDescription('  <p>Learn <strong>React</strong>   today</p>  '),
    ).toBe('Learn React today');
  });

  it('truncates at a word boundary', () => {
    const text =
      'تعلم البرمجة من خلال دورات عملية تغطي تطوير الويب والواجهات وقواعد البيانات مع مشاريع حقيقية من السوق';
    const result = toMetaDescription(text, 40);

    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(41);
    expect(result).not.toMatch(/\s…$/);
  });

  it('does not truncate short text', () => {
    expect(toMetaDescription('دورة React للمبتدئين')).toBe(
      'دورة React للمبتدئين',
    );
  });
});
