import { registerOutputSchema } from './registry/schema-registry';
import {
  evaluatorRubricV1JsonSchema,
  evaluatorRubricV1Schema,
} from './schemas/evaluator-rubric.v1';

export function registerStructuredOutputSchemas(): void {
  registerOutputSchema({
    id: 'evaluator-rubric',
    version: 1,
    description: 'Assignment rubric scores and feedback',
    agentIds: ['evaluator'],
    jsonSchema: evaluatorRubricV1JsonSchema as Record<string, unknown>,
    zodSchema: evaluatorRubricV1Schema,
    isActive: true,
  });
}
