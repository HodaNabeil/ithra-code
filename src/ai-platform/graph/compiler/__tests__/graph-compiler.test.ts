import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import { Annotation, END, START, StateGraph } from '@langchain/langgraph';

import { registerAgent, resetAgentRegistryForTests } from '../../../agents/definitions/agent-registry';
import { tutorAgentDefinition } from '../../../agents/tutor/tutor-agent.definition';
import {
  compileAgentGraph,
  compileGraph,
  resetCompiledGraphsForTests,
} from '../graph-compiler';
import { sanitizeInputNode } from '../../nodes/sanitize-input.node';
import { validateOutputNode } from '../../nodes/validate-output.node';
import { TutorAgentStateAnnotation } from '../../state/tutor-agent.state';

describe('graph compiler', () => {
  beforeEach(() => {
    resetAgentRegistryForTests();
    resetCompiledGraphsForTests();
    registerAgent(tutorAgentDefinition);
  });

  it('compiles tutor graph as singleton', () => {
    const first = compileGraph('tutor-graph');
    const second = compileGraph('tutor-graph');
    assert.equal(first, second);
  });

  it('resolves graph from agent definition', () => {
    const graph = compileAgentGraph('tutor');
    assert.ok(graph);
  });

  it('runs sanitize and validate nodes in linear tutor graph', async () => {
    const TestState = Annotation.Root({
      input: Annotation<string>,
      sanitizedInput: Annotation<string>,
      finalResponse: Annotation<string>,
      outputValid: Annotation<boolean>,
      validationErrors: Annotation<string[]>({
        reducer: (_left, right) => right,
        default: () => [],
      }),
    });

    const graph = new StateGraph(TestState)
      .addNode('sanitize-input', sanitizeInputNode as never)
      .addNode('validate-output', validateOutputNode as never)
      .addEdge(START, 'sanitize-input')
      .addEdge('sanitize-input', 'validate-output')
      .addEdge('validate-output', END)
      .compile();

    const result = await graph.invoke({
      input: '  hello   world  ',
      sanitizedInput: '',
      finalResponse: 'ok',
      outputValid: false,
      validationErrors: [],
    } as never);

    assert.equal(result.sanitizedInput, 'hello world');
    assert.equal(result.outputValid, true);
  });

  it('defines tutor state annotation spec', () => {
    assert.ok(TutorAgentStateAnnotation.spec);
    assert.ok(TutorAgentStateAnnotation.spec.input);
  });
});
