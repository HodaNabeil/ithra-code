import type { LlmMessage, LlmPort } from '../../domain/ports/llm.port';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import {
  estimateTokensFromText,
  resolveTokenUsage,
  type NormalizedTokenUsage,
} from '../../observability/usage';

const SUMMARY_PROMPT = {
  en: 'Summarize the following conversation for context. Preserve key facts, questions, and learning goals. Be concise.',
  ar: 'لخّص المحادثة التالية للسياق. احتفظ بالحقائق والأسئلة وأهداف التعلم الرئيسية. كن موجزاً.',
} as const;

export interface SummarizationInput {
  messages: LlmMessage[];
  locale: 'ar' | 'en';
  maxTokens: number;
}

export interface SummarizationResult {
  messages: LlmMessage[];
  summarized: boolean;
  estimatedTokens: number;
  usage: NormalizedTokenUsage;
}

function emptyUsage(): NormalizedTokenUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    tokenUsageEstimated: false,
    source: 'provider',
  };
}

async function runSummarizationLlm(
  llmPort: LlmPort,
  params: {
    summaryPrompt: string;
    olderText: string;
    model?: string;
  },
): Promise<{ summary: string; usage: NormalizedTokenUsage }> {
  if (llmPort.complete) {
    const result = await llmPort.complete({
      systemPrompt: params.summaryPrompt,
      messages: [{ role: 'user', content: params.olderText }],
      maxTokens: 400,
      temperature: 0.3,
      model: params.model,
    });

    const usage = resolveTokenUsage(
      result.usage
        ? {
            inputTokens: result.usage.input,
            outputTokens: result.usage.output,
          }
        : null,
      {
        inputText: `${params.summaryPrompt}\n${params.olderText}`,
        outputText: result.content,
        model: params.model,
      },
    );

    return { summary: result.content, usage };
  }

  let summary = '';
  let measuredUsage: { input: number; output: number } | undefined;

  for await (const token of llmPort.streamAnswer({
    systemPrompt: params.summaryPrompt,
    messages: [{ role: 'user', content: params.olderText }],
    maxTokens: 400,
    temperature: 0.3,
    model: params.model,
    onUsage: (usage) => {
      measuredUsage = usage;
    },
  })) {
    summary += token;
  }

  const usage = resolveTokenUsage(
    measuredUsage
      ? {
          inputTokens: measuredUsage.input,
          outputTokens: measuredUsage.output,
        }
      : null,
    {
      inputText: `${params.summaryPrompt}\n${params.olderText}`,
      outputText: summary,
      model: params.model,
    },
  );

  return { summary, usage };
}

export async function summarizeConversationIfNeeded(
  llmPort: LlmPort,
  input: SummarizationInput,
  options?: { model?: string },
): Promise<SummarizationResult> {
  const totalText = input.messages.map((message) => message.content).join('\n');
  const estimated = estimateTokensFromText(totalText, options?.model);

  if (estimated <= input.maxTokens || input.messages.length <= 2) {
    return {
      messages: input.messages,
      summarized: false,
      estimatedTokens: estimated,
      usage: emptyUsage(),
    };
  }

  const recentCount = Math.min(6, input.messages.length);
  const recent = input.messages.slice(-recentCount);
  const older = input.messages.slice(0, -recentCount);

  if (older.length === 0) {
    const recentText = recent.map((message) => message.content).join('\n');
    return {
      messages: input.messages.slice(-recentCount),
      summarized: true,
      estimatedTokens: estimateTokensFromText(recentText, options?.model),
      usage: emptyUsage(),
    };
  }

  const olderText = older.map((message) => `${message.role}: ${message.content}`).join('\n');
  const summaryPrompt = SUMMARY_PROMPT[input.locale];

  const { summary, usage: llmUsage } = await withSpan(
    'ai.memory.summarize',
    {
      'ai.summarize.message_count': older.length,
      'ai.summarize.locale': input.locale,
    },
    async () =>
      runSummarizationLlm(llmPort, {
        summaryPrompt,
        olderText,
        model: options?.model,
      }),
  );

  const summaryMessage: LlmMessage = {
    role: 'assistant',
    content: `[Previous conversation summary: ${summary.trim()}]`,
  };

  const merged = [summaryMessage, ...recent];
  return {
    messages: merged,
    summarized: true,
    estimatedTokens: estimateTokensFromText(
      merged.map((message) => message.content).join('\n'),
      options?.model,
    ),
    usage: llmUsage,
  };
}
