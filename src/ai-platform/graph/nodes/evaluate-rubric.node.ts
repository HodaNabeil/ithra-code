import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { generateStructuredOutput } from '../../structured-output/structured-output.service';
import { resolvePromptSync } from '../../prompts/resolver';
import type { EvaluatorAgentState } from '../state/evaluator-agent.state';
import { getGraphRuntimeConfig } from '../runtime-config';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function buildRubricPrompt(state: EvaluatorAgentState): string {
  const criteriaText = state.rubricCriteria
    .map((criterion) => `- ${criterion.id}: ${criterion.name} (max ${criterion.maxScore})`)
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
  const inputTokens = estimateTokens(`${state.systemPrompt}\n${userPrompt}`);

  const result = await generateStructuredOutput(runtime.llmPort, {
    schemaId: 'evaluator-rubric',
    schemaVersion: 1,
    systemPrompt: state.systemPrompt,
    userPrompt,
    locale: state.locale,
  });

  const outputTokens = estimateTokens(result.rawOutput);

  return {
    structuredOutput: result.data as EvaluatorAgentState['structuredOutput'],
    structuredOutputStatus: result.status,
    finalResponse: result.rawOutput,
    validationErrors: result.errors.map((error: { path: string; message: string }) => `${error.path}: ${error.message}`),
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
    },
  };
}
