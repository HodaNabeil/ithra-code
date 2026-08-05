import { END, START, StateGraph } from '@langchain/langgraph';

import { wrapGraphNode } from '../../observability/opentelemetry/span-helpers';
import { enrichResponseNode } from '../nodes/enrich-response.node';
import { generateResponseNode } from '../nodes/generate-response.node';
import { integrityCheckNode, routeAfterIntegrityCheck } from '../nodes/integrity-check.node';
import { loadHistoryNode } from '../nodes/load-history.node';
import { retrieveContextNode } from '../nodes/retrieve-context.node';
import { sanitizeInputNode } from '../nodes/sanitize-input.node';
import { toolCallNode } from '../nodes/tool-call.node';
import {
  routeAfterValidateOutput,
  validateOutputNode,
} from '../nodes/validate-output.node';
import { TutorAgentStateAnnotation } from '../state/tutor-agent.state';

const MAX_TOOL_ITERATIONS = 5;

function routeAfterGenerate(state: {
  pendingToolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  toolIterations?: number;
}): 'tool-call' | 'validate-output' {
  if (
    state.pendingToolCalls &&
    state.pendingToolCalls.length > 0 &&
    (state.toolIterations ?? 0) < MAX_TOOL_ITERATIONS
  ) {
    return 'tool-call';
  }
  return 'validate-output';
}

export function buildTutorGraph() {
  const graph = new StateGraph(TutorAgentStateAnnotation)
    .addNode('sanitize-input', wrapGraphNode('sanitize-input', sanitizeInputNode))
    .addNode('load-history', wrapGraphNode('load-history', loadHistoryNode))
    .addNode('integrity-check', wrapGraphNode('integrity-check', integrityCheckNode))
    .addNode('retrieve-context', wrapGraphNode('retrieve-context', retrieveContextNode))
    .addNode('generate-response', wrapGraphNode('generate-response', generateResponseNode))
    .addNode('tool-call', wrapGraphNode('tool-call', toolCallNode as never))
    .addNode('validate-output', wrapGraphNode('validate-output', validateOutputNode))
    .addNode('enrich-response', wrapGraphNode('enrich-response', enrichResponseNode))
    .addEdge(START, 'sanitize-input')
    .addEdge('sanitize-input', 'load-history')
    .addEdge('load-history', 'integrity-check')
    .addConditionalEdges('integrity-check', routeAfterIntegrityCheck, {
      'retrieve-context': 'retrieve-context',
      'validate-output': 'validate-output',
    })
    .addEdge('retrieve-context', 'generate-response')
    .addConditionalEdges('generate-response', routeAfterGenerate, {
      'tool-call': 'tool-call',
      'validate-output': 'validate-output',
    })
    .addEdge('tool-call', 'generate-response')
    .addConditionalEdges('validate-output', routeAfterValidateOutput, {
      'enrich-response': 'enrich-response',
      done: END,
    })
    .addEdge('enrich-response', END);

  return graph;
}

export const TUTOR_GRAPH_ID = 'tutor-graph';
