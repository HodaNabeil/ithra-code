import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { generateStructuredOutput } from '../../structured-output/structured-output.service';
import { resolvePromptSync } from '../../prompts/resolver';
import { toGraphTokenUpdate } from '../../observability/usage';
import type { EvaluatorAgentState } from '../state/evaluator-agent.state';
import { getGraphRuntimeConfig } from '../runtime-config';

function buildRubricPrompt(state: EvaluatorAgentState): string {
  const criteriaText = state.rubricCriteria
    .map(
      (criterion) =>
        `- ${criterion.id}: ${criterion.name} (max ${criterion.maxScore})`,
    )
    .join('\n');

  const locale = state.locale === 'ar' ? 'ar' : 'en';
  return resolvePromptSync('evaluator/rubric', locale, {
    criteriaText,
    submission: state.sanitizedInput || state.input,
  }).content;
}

export async function evaluateRubricNode(
  state: EvaluatorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<EvaluatorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);
  const userPrompt = buildRubricPrompt(state);

  const result = await generateStructuredOutput(runtime.llmPort, {
    schemaId: 'evaluator-rubric',
    schemaVersion: 1,
    systemPrompt: state.systemPrompt,
    userPrompt,
    locale: state.locale,
  });

  return {
    structuredOutput: result.data as EvaluatorAgentState['structuredOutput'],
    structuredOutputStatus: result.status,
    finalResponse: result.rawOutput,
    validationErrors: result.errors.map(
      (error: { path: string; message: string }) =>
        `${error.path}: ${error.message}`,
    ),
    ...toGraphTokenUpdate(result.usage),
  };
}
