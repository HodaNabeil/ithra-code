import { END, START, StateGraph } from '@langchain/langgraph';

import { wrapGraphNode } from '../../observability/opentelemetry/span-helpers';
import { evaluateRubricNode } from '../nodes/evaluate-rubric.node';
import { sanitizeInputNode } from '../nodes/sanitize-input.node';
import { EvaluatorAgentStateAnnotation } from '../state/evaluator-agent.state';

export function buildEvaluatorGraph() {
  const graph = new StateGraph(EvaluatorAgentStateAnnotation)
    .addNode(
      'sanitize-input',
      wrapGraphNode('sanitize-input', sanitizeInputNode as never),
    )
    .addNode(
      'evaluate-rubric',
      wrapGraphNode('evaluate-rubric', evaluateRubricNode),
    )
    .addEdge(START, 'sanitize-input')
    .addEdge('sanitize-input', 'evaluate-rubric')
    .addEdge('evaluate-rubric', END);

  return graph;
}

export const EVALUATOR_GRAPH_ID = 'evaluator-graph';
