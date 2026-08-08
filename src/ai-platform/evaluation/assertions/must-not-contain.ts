import type { EvalSample } from '../types';

export type MustNotContainViolation = {
  sampleId: string;
  phrase: string;
};

export function findMustNotContainViolations(
  sample: EvalSample,
  answer: string,
): MustNotContainViolation[] {
  if (!sample.mustNotContain || sample.mustNotContain.length === 0) {
    return [];
  }

  const normalizedAnswer = answer.toLowerCase();

  return sample.mustNotContain
    .filter((phrase) => normalizedAnswer.includes(phrase.toLowerCase()))
    .map((phrase) => ({
      sampleId: sample.id,
      phrase,
    }));
}

export function assertMustNotContain(
  samples: EvalSample[],
  answersBySampleId: Record<string, string>,
): MustNotContainViolation[] {
  const violations: MustNotContainViolation[] = [];

  for (const sample of samples) {
    const answer = answersBySampleId[sample.id];
    if (!answer) {
      continue;
    }

    violations.push(...findMustNotContainViolations(sample, answer));
  }

  return violations;
}
