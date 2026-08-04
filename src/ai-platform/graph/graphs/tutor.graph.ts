import { END, START, StateGraph } from '@langchain/langgraph';

import { wrapGraphNode } from '../../observability/opentelemetry/span-helpers';
import { generateResponseNode } from '../nodes/generate-response.node';
import { retrieveContextNode } from '../nodes/retrieve-context.node';
import { sanitizeInputNode } from '../nodes/sanitize-input.node';
import { toolCallNode } from '../nodes/tool-call.node';
import { validateOutputNode } from '../nodes/validate-output.node';
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
    .addNode('retrieve-context', wrapGraphNode('retrieve-context', retrieveContextNode))
    .addNode('generate-response', wrapGraphNode('generate-response', generateResponseNode))
    .addNode('tool-call', wrapGraphNode('tool-call', toolCallNode as never))
    .addNode('validate-output', wrapGraphNode('validate-output', validateOutputNode))
    .addEdge(START, 'sanitize-input')
    .addEdge('sanitize-input', 'retrieve-context')
    .addEdge('retrieve-context', 'generate-response')
    .addConditionalEdges('generate-response', routeAfterGenerate, {
      'tool-call': 'tool-call',
      'validate-output': 'validate-output',
    })
    .addEdge('tool-call', 'generate-response')
    .addEdge('validate-output', END);

  return graph;
}

export const TUTOR_GRAPH_ID = 'tutor-graph';
