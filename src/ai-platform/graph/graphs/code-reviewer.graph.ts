import { END, START, StateGraph } from '@langchain/langgraph';

import { wrapGraphNode } from '../../observability/opentelemetry/span-helpers';
import { sanitizeInputNode } from '../nodes/sanitize-input.node';
import { TutorAgentStateAnnotation } from '../state/tutor-agent.state';

/**
 * Code reviewer graph skeleton — full implementation in future phase.
 */
export function buildCodeReviewerGraph() {
  const graph = new StateGraph(TutorAgentStateAnnotation)
    .addNode(
      'sanitize-input',
      wrapGraphNode('sanitize-input', sanitizeInputNode),
    )
    .addEdge(START, 'sanitize-input')
    .addEdge('sanitize-input', END);

  return graph;
}

export const CODE_REVIEWER_GRAPH_ID = 'code-reviewer-graph';
