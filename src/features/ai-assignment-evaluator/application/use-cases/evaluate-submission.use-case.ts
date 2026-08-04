import { runAgent } from '@/ai-platform';

import type {
  EvaluateSubmissionInputDTO,
  EvaluationResultDTO,
} from '../dto/evaluate-submission.dto';
import type { EvaluatorRubricV1 } from '@/ai-platform/structured-output/schemas/evaluator-rubric.v1';

export async function evaluateSubmissionUseCase(
  input: EvaluateSubmissionInputDTO & { userId: string },
): Promise<EvaluationResultDTO> {
  const result = await runAgent('evaluator', {
    userId: input.userId,
    input: input.submission,
    locale: input.locale,
    scope: {
      userId: input.userId,
      courseId: input.courseId,
      assignmentId: input.assignmentId,
    },
    options: {
      metadata: {
        rubricCriteria: input.rubricCriteria,
      },
    },
  });

  const evaluation = result.structuredOutput as EvaluatorRubricV1 | undefined;
  const status =
    evaluation
      ? ('valid' as const)
      : ('rejected' as const);

  return {
    runId: result.runId,
    evaluation: evaluation ?? null,
    status,
    rawOutput: result.output,
    validationErrors: [],
    estimatedCostUsd: result.estimatedCost,
  };
}
