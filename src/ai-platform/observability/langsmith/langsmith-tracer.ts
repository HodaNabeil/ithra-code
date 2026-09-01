import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { RunTree } from 'langsmith/run_trees';

import { logger } from '@/lib/logger';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { getLangsmithRunId, setLangsmithRunId } from './trace-context';
import { redactTraceInputs, redactTraceMetadata } from './trace-redactor';

export type AgentTraceMetadata = {
  runId: string;
  agentId: string;
  userId: string;
  courseId?: string;
  lectureId?: string;
  promptVersion?: string;
  correlationId?: string;
  model?: string;
};

export type AgentTraceSession = {
  callbacks: BaseCallbackHandler[];
  runTree: RunTree | null;
  endTrace: (
    outputs?: Record<string, unknown>,
    error?: string,
  ) => Promise<void>;
};

function configureLangSmithEnv(): void {
  const config = AIPlatformConfig.getLangSmithConfig();
  if (!config.enabled) {
    return;
  }

  process.env.LANGCHAIN_TRACING_V2 = 'true';
  process.env.LANGCHAIN_API_KEY = config.apiKey;
  process.env.LANGCHAIN_PROJECT = config.project;
  if (config.endpoint) {
    process.env.LANGCHAIN_ENDPOINT = config.endpoint;
  }
}

export function createAgentTraceSession(
  metadata: AgentTraceMetadata,
  inputs: Record<string, unknown>,
): AgentTraceSession {
  if (!AIPlatformConfig.isLangSmithTracingEnabled()) {
    return {
      callbacks: [],
      runTree: null,
      endTrace: async () => undefined,
    };
  }

  try {
    configureLangSmithEnv();
    const project = AIPlatformConfig.getLangSmithConfig().project;

    const runTree = new RunTree({
      id: metadata.runId,
      name: `agent:${metadata.agentId}`,
      run_type: 'chain',
      inputs: redactTraceInputs(inputs),
      project_name: project,
      metadata: redactTraceMetadata({
        agentId: metadata.agentId,
        userId: metadata.userId,
        courseId: metadata.courseId,
        lectureId: metadata.lectureId,
        promptVersion: metadata.promptVersion,
        correlationId: metadata.correlationId,
        model: metadata.model,
      }),
      tags: [metadata.agentId, metadata.promptVersion ?? 'unknown-prompt'],
    });

    void runTree.postRun().catch((error) => {
      logger.warn({ error }, '[LANGSMITH_POST_RUN_FAILED]');
    });

    setLangsmithRunId(runTree.id);

    const tracer = new LangChainTracer({
      projectName: project,
    });

    return {
      callbacks: [tracer],
      runTree,
      endTrace: async (outputs, error) => {
        try {
          await runTree.end(outputs, error);
        } catch (endError) {
          logger.warn({ endError }, '[LANGSMITH_END_RUN_FAILED]');
        }
      },
    };
  } catch (error) {
    logger.warn({ error }, '[LANGSMITH_TRACE_SESSION_FAILED]');
    return {
      callbacks: [],
      runTree: null,
      endTrace: async () => undefined,
    };
  }
}

export function resolveLangsmithRunIdForLedger(): string | undefined {
  return getLangsmithRunId();
}
