import type { LlmMessage, LlmPort } from '../../domain/ports/llm.port';

const SUMMARY_PROMPT = {
  en: 'Summarize the following conversation for context. Preserve key facts, questions, and learning goals. Be concise.',
  ar: 'لخّص المحادثة التالية للسياق. احتفظ بالحقائق والأسئلة وأهداف التعلم الرئيسية. كن موجزاً.',
} as const;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface SummarizationInput {
  messages: LlmMessage[];
  locale: 'ar' | 'en';
  maxTokens: number;
}

export interface SummarizationResult {
  messages: LlmMessage[];
  summarized: boolean;
  estimatedTokens: number;
}

export async function summarizeConversationIfNeeded(
  llmPort: LlmPort,
  input: SummarizationInput,
): Promise<SummarizationResult> {
  const totalText = input.messages.map((message) => message.content).join('\n');
  const estimated = estimateTokens(totalText);

  if (estimated <= input.maxTokens || input.messages.length <= 2) {
    return {
      messages: input.messages,
      summarized: false,
      estimatedTokens: estimated,
    };
  }

  const recentCount = Math.min(6, input.messages.length);
  const recent = input.messages.slice(-recentCount);
  const older = input.messages.slice(0, -recentCount);

  if (older.length === 0) {
    return {
      messages: input.messages.slice(-recentCount),
      summarized: true,
      estimatedTokens: estimateTokens(recent.map((m) => m.content).join('\n')),
    };
  }

  const olderText = older.map((message) => `${message.role}: ${message.content}`).join('\n');
  const summaryPrompt = SUMMARY_PROMPT[input.locale];

  let summary = '';
  if (llmPort.complete) {
    const result = await llmPort.complete({
      systemPrompt: summaryPrompt,
      messages: [{ role: 'user', content: olderText }],
      maxTokens: 400,
      temperature: 0.3,
    });
    summary = result.content;
  } else {
    for await (const token of llmPort.streamAnswer({
      systemPrompt: summaryPrompt,
      messages: [{ role: 'user', content: olderText }],
      maxTokens: 400,
      temperature: 0.3,
    })) {
      summary += token;
    }
  }

  const summaryMessage: LlmMessage = {
    role: 'assistant',
    content: `[Previous conversation summary: ${summary.trim()}]`,
  };

  const merged = [summaryMessage, ...recent];
  return {
    messages: merged,
    summarized: true,
    estimatedTokens: estimateTokens(merged.map((m) => m.content).join('\n')),
  };
}
