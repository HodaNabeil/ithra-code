import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../state/tutor-agent.state';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s*:\s*/gi,
  /<\s*script/gi,
];

function sanitizeText(input: string): string {
  let sanitized = input.trim().replace(/\s+/g, ' ');
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized.slice(0, 5000);
}

export async function sanitizeInputNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  return {
    sanitizedInput: sanitizeText(state.input),
  };
}
