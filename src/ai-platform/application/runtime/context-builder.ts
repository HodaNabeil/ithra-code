import type { LlmMessage } from '../../domain/ports/llm.port';
import type { AgentDefinition, AgentRunRequest } from '../../agents/base/agent-definition';
import type { AgentGraphState } from '../../graph/compiler/graph-compiler';
import type { EvaluatorAgentState } from '../../graph/state/evaluator-agent.state';
import type {
  TutorAgentState,
  TutorPersonalizationContext,
} from '../../graph/state/tutor-agent.state';
import { resolvePromptSync } from '../../prompts/resolver';

/**
 * Metadata a caller (e.g. src/features/ai-tutor) may pass alongside a tutor
 * run request. Note: `systemPrompt` and `retrievedChunks` are intentionally
 * NOT accepted here — ai-platform builds the system prompt and fetches RAG
 * context itself (see retrieve-context.node.ts / tutor-system-prompt.builder.ts).
 * Only raw conversation history and plain personalization facts may be
 * supplied by the feature layer.
 */
export interface TutorRunMetadata {
  conversationHistory: LlmMessage[];
  personalization?: TutorPersonalizationContext;
  promptVersion?: string;
}

export interface BuiltContext {
  initialState: AgentGraphState;
  promptVersion: string;
}

export interface RuntimeExecutionContext {
  runId: string;
  agentId: string;
  agent: AgentDefinition;
  request: AgentRunRequest;
  startedAt: number;
}

const EVALUATOR_SYSTEM_PROMPTS = {
  ar: resolvePromptSync('evaluator/system', 'ar').content,
  en: resolvePromptSync('evaluator/system', 'en').content,
} as const;

const DEFAULT_SYSTEM_PROMPTS = {
  ar: resolvePromptSync('tutor/system', 'ar').content,
  en: resolvePromptSync('tutor/system', 'en').content,
} as const;

function resolveLocale(request: AgentRunRequest): 'ar' | 'en' {
  if (request.locale) {
    return request.locale;
  }
  const optionLocale = request.options?.locale;
  if (optionLocale?.startsWith('ar')) {
    return 'ar';
  }
  return 'en';
}

function parseRubricCriteria(request: AgentRunRequest): EvaluatorAgentState['rubricCriteria'] {
  const raw = request.options?.metadata?.rubricCriteria;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is { id: string; name: string; maxScore: number } => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { name?: unknown }).name === 'string' &&
        typeof (item as { maxScore?: unknown }).maxScore === 'number'
      );
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      maxScore: item.maxScore,
    }));
}

function isLlmMessage(value: unknown): value is LlmMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as LlmMessage).role !== undefined &&
    typeof (value as LlmMessage).content === 'string'
  );
}

function isPersonalizationContext(value: unknown): value is TutorPersonalizationContext {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;

  const stringFieldsOk = (['studentName', 'learningLevel', 'courseTitle'] as const).every(
    (key) => candidate[key] === undefined || typeof candidate[key] === 'string',
  );
  const progressOk =
    candidate.progressPercent === undefined || typeof candidate.progressPercent === 'number';
  const gapsOk =
    candidate.knowledgeGaps === undefined ||
    (Array.isArray(candidate.knowledgeGaps) &&
      candidate.knowledgeGaps.every((gap) => typeof gap === 'string'));
  const sessionMetaOk =
    candidate.sessionMetaMode === undefined || typeof candidate.sessionMetaMode === 'boolean';

  return stringFieldsOk && progressOk && gapsOk && sessionMetaOk;
}

function parseTutorRunMetadata(
  request: AgentRunRequest,
): TutorRunMetadata | null {
  const raw = request.options?.metadata;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const conversationHistory = raw.conversationHistory;

  if (!Array.isArray(conversationHistory) || !conversationHistory.every(isLlmMessage)) {
    return null;
  }

  const personalization =
    'personalization' in raw && isPersonalizationContext(raw.personalization)
      ? raw.personalization
      : undefined;

  const promptVersion =
    typeof raw.promptVersion === 'string' ? raw.promptVersion : undefined;

  return {
    conversationHistory,
    personalization,
    promptVersion,
  };
}

function resolveSystemPrompt(agent: AgentDefinition, locale: 'ar' | 'en'): string {
  if (agent.promptNamespace === 'evaluator') {
    return EVALUATOR_SYSTEM_PROMPTS[locale];
  }
  if (agent.promptNamespace === 'tutor') {
    return DEFAULT_SYSTEM_PROMPTS[locale];
  }
  return resolvePromptSync('tutor/system', locale).content || DEFAULT_SYSTEM_PROMPTS.en;
}

function resolveDefaultPromptVersion(agent: AgentDefinition, locale: 'ar' | 'en'): string {
  if (agent.promptNamespace === 'evaluator') {
    return resolvePromptSync('evaluator/system', locale).version;
  }
  return resolvePromptSync('tutor/system', locale).version;
}

function buildTutorState(
  agent: AgentDefinition,
  request: AgentRunRequest,
  locale: 'ar' | 'en',
): TutorAgentState {
  const tutorMetadata = parseTutorRunMetadata(request);

  return {
    agentId: agent.id,
    userId: request.userId,
    input: request.input,
    locale,
    systemPrompt: resolveSystemPrompt(agent, locale),
    personalization: tutorMetadata?.personalization,
    conversationHistory: tutorMetadata?.conversationHistory ?? [],
    retrievedChunks: [],
    sanitizedInput: '',
    assessmentBlocked: false,
    finalResponse: '',
    outputValid: false,
    validationErrors: [],
    tokensUsed: { input: 0, output: 0 },
    pendingToolCalls: [],
    toolResults: [],
    toolIterations: 0,
  };
}

function buildEvaluatorState(
  agent: AgentDefinition,
  request: AgentRunRequest,
  locale: 'ar' | 'en',
): EvaluatorAgentState {
  return {
    agentId: agent.id,
    userId: request.userId,
    input: request.input,
    locale,
    systemPrompt: resolveSystemPrompt(agent, locale),
    rubricCriteria: parseRubricCriteria(request),
    sanitizedInput: '',
    structuredOutputStatus: 'pending',
    finalResponse: '',
    validationErrors: [],
    tokensUsed: { input: 0, output: 0 },
  };
}

export function buildAgentContext(
  agent: AgentDefinition,
  request: AgentRunRequest,
): BuiltContext {
  const locale = resolveLocale(request);

  const initialState: AgentGraphState =
    agent.id === 'evaluator'
      ? buildEvaluatorState(agent, request, locale)
      : buildTutorState(agent, request, locale);

  const tutorMetadata =
    agent.id === 'tutor' ? parseTutorRunMetadata(request) : null;

  return {
    initialState,
    promptVersion:
      tutorMetadata?.promptVersion ??
      request.options?.promptVersion ??
      resolveDefaultPromptVersion(agent, locale),
  };
}
