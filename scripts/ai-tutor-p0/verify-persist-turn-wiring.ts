import assert from 'node:assert/strict';

import { buildTutorGraph } from '@/ai-platform/graph/graphs/tutor.graph';

function main(): void {
  const compiled = buildTutorGraph().compile();
  const graph = compiled.getGraph();
  const nodes = new Set(Object.keys(graph.nodes));

  assert(nodes.has('persist-turn'), 'persist-turn node must be registered');

  assert(
    graph.edges.some(
      (edge) => edge.source === 'enrich-response' && edge.target === 'persist-turn',
    ),
    'enrich-response must route to persist-turn',
  );
  assert(
    graph.edges.some(
      (edge) => edge.source === 'persist-turn' && edge.target === '__end__',
    ),
    'persist-turn must route to END',
  );

  const validateOutgoing = graph.edges.filter((edge) => edge.source === 'validate-output');
  assert(
    validateOutgoing.some((edge) => edge.target === 'persist-turn'),
    'validate-output must have a branch to persist-turn',
  );

  console.log('[verify-persist-turn-wiring] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-persist-turn-wiring] FAIL', error);
  process.exit(1);
}
