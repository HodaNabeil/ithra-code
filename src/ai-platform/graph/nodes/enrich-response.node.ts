import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { getGraphRuntimeConfig } from '../runtime-config';
import type { TutorAgentState } from '../state/tutor-agent.state';

/**
 * Append-only enrichment for responses that were short-circuited or processed
 * by upstream guardrail nodes (e.g. lecture suggestions after assessment block).
 */
export async function enrichResponseNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  if (!state.assessmentBlocked) {
    return {};
  }

  let enricher: ReturnType<typeof getGraphRuntimeConfig>['responseEnricher'];
  let enrichmentContext: Record<string, unknown> | undefined;

  try {
    const runtime = getGraphRuntimeConfig(config);
    enricher = runtime.responseEnricher;
    enrichmentContext = runtime.enrichmentContext;
  } catch {
    return {};
  }

  if (!enricher || !state.finalResponse?.trim()) {
    return {};
  }

  const enriched = await enricher.enrich(state.finalResponse, {
    question: state.sanitizedInput || state.input,
    metadata: enrichmentContext,
  });

  return { finalResponse: enriched };
}
