import type { EvaluatorRubricV1 } from '@/ai-platform/structured-output/schemas/evaluator-rubric.v1';

export interface EvaluationResult {
  runId: string;
  schemaVersion: number;
  overallGrade: EvaluatorRubricV1['overallGrade'];
  scores: EvaluatorRubricV1['scores'];
  feedback: string;
  confidence: number;
  status: 'valid' | 'repaired' | 'rejected';
}

export function mapToEvaluationResult(
  runId: string,
  data: EvaluatorRubricV1 | undefined,
  status: 'valid' | 'repaired' | 'rejected' | 'pending',
): EvaluationResult | null {
  if (!data || status === 'rejected' || status === 'pending') {
    return null;
  }

  return {
    runId,
    schemaVersion: data.schemaVersion,
    overallGrade: data.overallGrade,
    scores: data.scores,
    feedback: data.feedback,
    confidence: data.confidence,
    status,
  };
}
