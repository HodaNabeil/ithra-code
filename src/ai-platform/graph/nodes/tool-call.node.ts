import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { executeTool } from '../../tools/executor/tool-executor';
import { getGraphRuntimeConfig } from '../runtime-config';

interface ToolCallState {
  userId: string;
  agentId: string;
  courseId?: string;
  pendingToolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  toolIterations: number;
}

export async function toolCallNode(
  state: ToolCallState,
  config: LangGraphRunnableConfig,
): Promise<{
  toolResults: Array<{ toolCallId: string; output: Record<string, unknown> }>;
  pendingToolCalls: [];
  toolIterations: number;
}> {
  const runtime = getGraphRuntimeConfig(config);
  const allowedTools = runtime.allowedTools ?? [];
  const results: Array<{ toolCallId: string; output: Record<string, unknown> }> = [];

  for (const call of state.pendingToolCalls) {
    const courseId = runtime.courseId;
    const result = await executeTool(
      call.name,
      call.arguments,
      {
        userId: state.userId,
        agentRunId: runtime.runId ?? 'unknown',
        scope: {
          type: 'course',
          userId: state.userId,
          courseId,
          lectureId: runtime.lectureId,
        },
        signal: config.signal ?? AbortSignal.timeout(30_000),
        courseId,
      },
      allowedTools,
    );

    results.push({
      toolCallId: call.id,
      output: result.success
        ? (result.output ?? {})
        : { error: result.error?.message ?? 'Tool failed' },
    });
  }

  return {
    toolResults: results,
    pendingToolCalls: [],
    toolIterations: state.toolIterations + 1,
  };
}
