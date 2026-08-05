import type {
  RetrievedChunkState,
  TutorPersonalizationContext,
} from '../graph/state/tutor-agent.state';
import { resolvePromptSync } from './resolver';

export interface BuildTutorSystemPromptInput {
  locale: 'ar' | 'en';
  /** Base tutor instructions (resolved by context-builder, e.g. tutor/system template). */
  basePrompt: string;
  retrievedChunks: RetrievedChunkState[];
  personalization?: TutorPersonalizationContext;
}

export function isAssessmentAdjacent(chunks: RetrievedChunkState[]): boolean {
  return chunks.some((chunk) => {
    const metadata = chunk.metadata ?? {};
    const contentType = String(metadata.contentType ?? '').toUpperCase();
    return (
      metadata.isAssessment === true ||
      metadata.sensitivity === 'ASSESSMENT' ||
      contentType.includes('QUIZ') ||
      contentType.includes('ASSIGNMENT')
    );
  });
}

function formatRetrievedChunks(chunks: RetrievedChunkState[]): string {
  return chunks
    .map((chunk, index) => {
      const title = String(chunk.metadata?.title ?? `Source ${index + 1}`);
      const confidence = Math.round(chunk.score * 100);
      return `### Source ${index + 1}: ${title} (confidence: ${confidence}%)\n${chunk.content}`;
    })
    .join('\n\n');
}

function formatPersonalization(context: TutorPersonalizationContext): string[] {
  const lines: string[] = ['## Session context'];

  if (context.studentName) {
    lines.push(`- Student: ${context.studentName}`);
  }
  if (context.learningLevel) {
    lines.push(`- Learning level: ${context.learningLevel}`);
  }
  if (context.courseTitle) {
    lines.push(`- Course: ${context.courseTitle}`);
  }
  if (typeof context.progressPercent === 'number') {
    lines.push(`- Course progress: ${context.progressPercent}%`);
  }
  if (context.knowledgeGaps && context.knowledgeGaps.length > 0) {
    lines.push(`- Potential knowledge gaps: ${context.knowledgeGaps.join(', ')}`);
  }

  return lines.length > 1 ? lines : [];
}

/**
 * Builds the final tutor system prompt from graph state: base instructions +
 * optional assessment-integrity boundary + personalization facts + retrieved
 * RAG context (or a fallback/session-meta note when no chunks were found).
 *
 * This is the single place ai-platform assembles the tutor prompt — callers
 * (graph nodes) must not accept a pre-built prompt string from the feature layer.
 */
export function buildTutorSystemPrompt(input: BuildTutorSystemPromptInput): string {
  const { locale, basePrompt, retrievedChunks, personalization } = input;
  const lines = [basePrompt];

  if (isAssessmentAdjacent(retrievedChunks)) {
    lines.push('', resolvePromptSync('tutor/assessment-boundary', locale).content);
  }

  if (personalization) {
    const personalizationLines = formatPersonalization(personalization);
    if (personalizationLines.length > 0) {
      lines.push('', ...personalizationLines);
    }
  }

  if (retrievedChunks.length > 0) {
    lines.push('', '## Relevant course material', formatRetrievedChunks(retrievedChunks));
    lines.push(
      '',
      'When answering, naturally cite the source (e.g. "according to the lecture...") when appropriate.',
    );
  } else if (personalization?.sessionMetaMode) {
    lines.push('', resolvePromptSync('tutor/session-context', locale).content);
  } else {
    lines.push('', resolvePromptSync('tutor/rag-fallback', locale).content);
  }

  return lines.join('\n');
}
