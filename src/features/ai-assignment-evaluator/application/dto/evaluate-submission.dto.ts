import { z } from 'zod';

import type { EvaluatorRubricV1 } from '@/ai-platform/structured-output/schemas/evaluator-rubric.v1';

export const rubricCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  maxScore: z.number().min(1).max(100),
});

export const evaluateSubmissionInputSchema = z.object({
  submission: z.string().min(1).max(50_000),
  courseId: z.string().min(1),
  assignmentId: z.string().min(1).optional(),
  rubricCriteria: z.array(rubricCriterionSchema).min(1),
  locale: z.enum(['ar', 'en']).optional(),
});

export type EvaluateSubmissionInputDTO = z.infer<typeof evaluateSubmissionInputSchema>;

export interface EvaluationResultDTO {
  runId: string;
  evaluation: EvaluatorRubricV1 | null;
  status: 'valid' | 'repaired' | 'rejected' | 'pending';
  rawOutput: string;
  validationErrors: string[];
  estimatedCostUsd?: number;
}
