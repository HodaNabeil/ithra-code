import type { AgentDefinition } from '../base/agent-definition';

export const tutorAgentDefinition: AgentDefinition = {
  id: 'tutor',
  name: 'AI Tutor',
  description: 'Course-scoped educational assistant with RAG',
  graphId: 'tutor-graph',
  capabilities: ['STREAMING', 'RAG', 'TOOLS'],
  defaultModelPolicy: {
    task: 'education',
    preferredModel: 'gpt-4o-mini',
    maxTokens: 1500,
    temperature: 0.7,
  },
  allowedTools: ['search', 'calculator'],
  memoryScope: 'CONVERSATION',
  promptNamespace: 'tutor',
  retrievalMode: 'eager',
  guards: {
    rateLimitPerMinute: 10,
    rateLimitPerHour: 60,
    dailyCostCap: 100,
    maxConcurrentStreams: 3,
  },
};
