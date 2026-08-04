import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tutorAgentDefinition } from '@/ai-platform/agents/tutor/tutor-agent.definition';

describe('agent runtime — tutor stream', () => {
  it('exposes tutor guard configuration on agent definition', () => {
    assert.equal(tutorAgentDefinition.id, 'tutor');
    assert.equal(tutorAgentDefinition.graphId, 'tutor-graph');
    assert.equal(tutorAgentDefinition.retrievalMode, 'eager');
    assert.equal(tutorAgentDefinition.guards.rateLimitPerMinute, 10);
    assert.equal(tutorAgentDefinition.guards.maxConcurrentStreams, 3);
    assert.deepEqual(tutorAgentDefinition.allowedTools, ['search', 'calculator']);
  });
});
