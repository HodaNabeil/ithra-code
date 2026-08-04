import type { CompiledStateGraph } from '@langchain/langgraph';

import { getAgentDefinition } from '../../agents/definitions/agent-registry';
import {
  buildCodeReviewerGraph,
  CODE_REVIEWER_GRAPH_ID,
} from '../graphs/code-reviewer.graph';
import {
  buildEvaluatorGraph,
  EVALUATOR_GRAPH_ID,
} from '../graphs/evaluator.graph';
import { buildTutorGraph, TUTOR_GRAPH_ID } from '../graphs/tutor.graph';
import type { EvaluatorAgentState } from '../state/evaluator-agent.state';
import {
  TutorAgentStateAnnotation,
  type TutorAgentState,
} from '../state/tutor-agent.state';

export type AgentGraphState = TutorAgentState | EvaluatorAgentState;

type CompiledAgentGraph = CompiledStateGraph<
  AgentGraphState,
  Partial<AgentGraphState>,
  string
>;

const compiledGraphs = new Map<string, CompiledAgentGraph>();

export function compileGraph(graphId: string): CompiledAgentGraph {
  const cached = compiledGraphs.get(graphId);
  if (cached) {
    return cached;
  }

  let compiled: CompiledAgentGraph;

  switch (graphId) {
    case TUTOR_GRAPH_ID:
      compiled = buildTutorGraph().compile() as CompiledAgentGraph;
      break;
    case EVALUATOR_GRAPH_ID:
      compiled = buildEvaluatorGraph().compile() as CompiledAgentGraph;
      break;
    case CODE_REVIEWER_GRAPH_ID:
      compiled = buildCodeReviewerGraph().compile() as CompiledAgentGraph;
      break;
    default:
      throw new Error(`Unknown graph: ${graphId}`);
  }

  compiledGraphs.set(graphId, compiled);
  return compiled;
}

export function compileAgentGraph(agentId: string): CompiledAgentGraph {
  const definition = getAgentDefinition(agentId);
  return compileGraph(definition.graphId);
}

export function resetCompiledGraphsForTests(): void {
  compiledGraphs.clear();
}

export { TutorAgentStateAnnotation };
