import { AsyncLocalStorage } from 'node:async_hooks';

export type AgentTraceContext = {
  runId: string;
  agentId: string;
  langsmithRunId?: string;
  correlationId?: string;
};

const traceStorage = new AsyncLocalStorage<AgentTraceContext>();

export function runWithTraceContext<T>(
  context: AgentTraceContext,
  fn: () => T,
): T {
  return traceStorage.run(context, fn);
}

export function runWithTraceContextAsync<T>(
  context: AgentTraceContext,
  fn: () => Promise<T>,
): Promise<T> {
  return traceStorage.run(context, fn);
}

export function getCurrentTraceContext(): AgentTraceContext | undefined {
  return traceStorage.getStore();
}

export function setLangsmithRunId(langsmithRunId: string): void {
  const store = traceStorage.getStore();
  if (store) {
    store.langsmithRunId = langsmithRunId;
  }
}

export function getLangsmithRunId(): string | undefined {
  return traceStorage.getStore()?.langsmithRunId;
}
