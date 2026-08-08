import { streamAgent } from '@/ai-platform';

import type { EvalDataset, EvalSample } from '../types';
import { assertMustNotContain } from '../assertions/must-not-contain';
import { EVAL_COURSE_ID, EVAL_USER_ID } from '../fixtures/eval-fixtures';

export type AgentEvalEnrichmentResult = {
  dataset: EvalDataset;
  answersBySampleId: Record<string, string>;
  mustNotContainViolations: ReturnType<typeof assertMustNotContain>;
  agentInvoked: boolean;
};

async function invokeTutorAgent(sample: EvalSample): Promise<{
  answer: string;
  retrievedContext: string[];
}> {
  let answer = '';
  const retrievedContext: string[] = [];

  for await (const event of streamAgent('tutor', {
    userId: EVAL_USER_ID,
    input: sample.input,
    locale: sample.locale ?? 'ar',
    scope: {
      userId: EVAL_USER_ID,
      courseId: sample.courseId ?? EVAL_COURSE_ID,
    },
    options: {
      metadata: {
        conversationHistory: [],
        evalMode: true,
      },
    },
  })) {
    if (event.type === 'token') {
      answer += event.text;
    }

    if (event.type === 'meta' && Array.isArray(event.sources)) {
      for (const source of event.sources) {
        if (typeof source.content === 'string') {
          retrievedContext.push(source.content);
        }
      }
    }
  }

  return { answer, retrievedContext };
}

export async function enrichDatasetWithAgentOutput(
  dataset: EvalDataset,
): Promise<AgentEvalEnrichmentResult> {
  const platformEnabled = process.env.AI_PLATFORM_ENABLED === 'true';
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const agentInvoked = platformEnabled && hasApiKey && dataset.agentId === 'tutor';

  const answersBySampleId: Record<string, string> = {};
  const enrichedSamples: EvalSample[] = [];

  for (const sample of dataset.samples) {
    if (agentInvoked) {
      try {
        const result = await invokeTutorAgent(sample);
        answersBySampleId[sample.id] = result.answer;
        enrichedSamples.push({
          ...sample,
          answer: result.answer,
          retrievedContext:
            result.retrievedContext.length > 0
              ? result.retrievedContext
              : sample.retrievedContext,
        });
        continue;
      } catch {
        // Fall through to static sample fields when the live agent cannot run.
      }
    }

    const fallbackAnswer = sample.groundTruth ?? '';
    answersBySampleId[sample.id] = fallbackAnswer;
    enrichedSamples.push({
      ...sample,
      answer: fallbackAnswer,
    });
  }

  const mustNotContainViolations = assertMustNotContain(
    dataset.samples,
    answersBySampleId,
  );

  return {
    dataset: {
      ...dataset,
      samples: enrichedSamples,
    },
    answersBySampleId,
    mustNotContainViolations,
    agentInvoked,
  };
}
