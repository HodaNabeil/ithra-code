import { z } from 'zod';

export const evaluatorRubricV1Schema = z.object({
  schemaVersion: z.literal(1),
  overallGrade: z.enum(['A', 'B', 'C', 'D', 'F', 'pass', 'fail']),
  scores: z.array(
    z.object({
      criterionId: z.string(),
      criterionName: z.string(),
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
  ),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
});

export type EvaluatorRubricV1 = z.infer<typeof evaluatorRubricV1Schema>;

export const evaluatorRubricV1JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'overallGrade', 'scores', 'feedback', 'confidence'],
  properties: {
    schemaVersion: { type: 'integer', const: 1 },
    overallGrade: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D', 'F', 'pass', 'fail'],
    },
    scores: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterionId', 'criterionName', 'score', 'feedback'],
        properties: {
          criterionId: { type: 'string' },
          criterionName: { type: 'string' },
          score: { type: 'number', minimum: 0, maximum: 100 },
          feedback: { type: 'string' },
        },
      },
    },
    feedback: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;
