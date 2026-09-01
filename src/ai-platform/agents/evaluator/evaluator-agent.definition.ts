import type { AgentDefinition } from '../base/agent-definition';

export const evaluatorAgentDefinition: AgentDefinition = {
  id: 'evaluator',
  name: 'AI Assignment Evaluator',
  description: 'Rubric-based assignment evaluation with structured JSON output',
  graphId: 'evaluator-graph',
  capabilities: ['STRUCTURED_OUTPUT'],
  defaultModelPolicy: {
    task: 'evaluation',
    preferredModel: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.2,
  },
  allowedTools: [],
  memoryScope: 'SESSION',
  promptNamespace: 'evaluator',
  guards: {
    rateLimitPerMinute: 10,
    rateLimitPerHour: 60,
    dailyCostCap: 50,
    maxConcurrentStreams: 2,
  },
};

export const codeReviewerAgentDefinition: AgentDefinition = {
  id: 'code-reviewer',
  name: 'AI Code Reviewer',
  description: 'Automated code review with tool-assisted analysis (stub)',
  graphId: 'code-reviewer-graph',
  capabilities: ['STREAMING', 'TOOLS'],
  defaultModelPolicy: {
    task: 'code_review',
    preferredModel: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.3,
  },
  allowedTools: ['code-analyze', 'mcp:filesystem:read_file'],
  memoryScope: 'SESSION',
  promptNamespace: 'code-reviewer',
  guards: {
    rateLimitPerMinute: 5,
    rateLimitPerHour: 30,
    dailyCostCap: 50,
    maxConcurrentStreams: 2,
  },
};

export const supervisorAgentDefinition: AgentDefinition = {
  id: 'supervisor',
  name: 'AI Supervisor',
  description:
    'Routes user intent to tutor, evaluator, or code-reviewer agents',
  graphId: 'supervisor-graph',
  capabilities: ['STRUCTURED_OUTPUT'],
  defaultModelPolicy: {
    task: 'education',
    preferredModel: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.1,
  },
  allowedTools: [],
  memoryScope: 'SESSION',
  promptNamespace: 'supervisor',
  guards: {
    rateLimitPerMinute: 20,
    rateLimitPerHour: 120,
    dailyCostCap: 25,
    maxConcurrentStreams: 3,
  },
};

export type SupervisorRoute = 'tutor' | 'evaluator' | 'code-reviewer';

export function detectSupervisorRoute(input: string): SupervisorRoute {
  const normalized = input.toLowerCase();

  if (
    normalized.includes('grade') ||
    normalized.includes('rubric') ||
    normalized.includes('evaluate') ||
    normalized.includes('تقييم') ||
    normalized.includes('تصحيح')
  ) {
    return 'evaluator';
  }

  if (
    normalized.includes('code review') ||
    normalized.includes('lint') ||
    normalized.includes('bug') ||
    normalized.includes('مراجعة الكود')
  ) {
    return 'code-reviewer';
  }

  return 'tutor';
}
