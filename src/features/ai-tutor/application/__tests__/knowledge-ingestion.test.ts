import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AttachmentType, CourseStatus, LectureType } from '@/generated/prisma/enums';

import {
  collectCourseKnowledgeSources,
  collectLectureKnowledgeSources,
} from '@/ai-platform/rag/ingestion/content-collector.service';
import {
  detectContentChange,
} from '@/ai-platform/rag/ingestion/content-hash.service';
import {
  computeContentHash,
  detectContentFormat,
  normalizeKnowledgeText,
} from '@/ai-platform/rag/ingestion/text-normalizer.service';
import {
  chunkContentByKind,
  chunkMarkdownContent,
} from '@/ai-platform/indexing/services/text-chunker.service';
import { markdownContentExtractor } from '@/ai-platform/rag/ingestion/extractors/inline-extractors';
import { transcriptExtractor } from '@/ai-platform/rag/ingestion/extractors/transcript-extractor';
import { buildKnowledgeChunkRecords } from '@/ai-platform/rag/ingestion/chunk-builder.service';
import {
  ingestCourseKnowledge,
  ingestLectureKnowledge,
} from '@/ai-platform/rag/ingestion/knowledge-ingestion-pipeline.service';
import type { CourseForIndexingDTO } from '@/features/ai-tutor/domain/ports/CourseContentRepositoryPort';
import type { KnowledgeSourceHashRepositoryPort } from '@/features/ai-tutor/domain/ports/KnowledgeSourceHashRepositoryPort';
import type { KnowledgeChunkRepositoryPort } from '@/features/ai-tutor/domain/ports/KnowledgeChunkRepositoryPort';
import type { EmbeddingPort } from '@/features/ai-tutor/domain/ports/EmbeddingPort';
import { isExtractionSkipped } from '@/features/ai-tutor/domain/models/KnowledgeSource';

const sampleCourse: CourseForIndexingDTO = {
  id: 'course-1',
  slug: 'react-fundamentals',
  title: 'React Fundamentals',
  description: 'Learn React from scratch',
  shortDescription: 'Beginner React course',
  objectives: ['Understand components', 'Use hooks'],
  status: CourseStatus.PUBLISHED,
  instructorId: 'instructor-1',
  sections: [
    {
      id: 'section-1',
      title: 'Introduction',
      lectures: [
        {
          id: 'lecture-1',
          title: 'What is React?',
          description: 'An introduction to React library',
          content: '# React Basics\n\nReact is a JavaScript library.\n\n```js\nconst App = () => <div />;\n```',
          type: LectureType.TEXT,
          attachments: [
            {
              id: 'attachment-1',
              name: 'cheatsheet.pdf',
              description: null,
              content: null,
              type: AttachmentType.PDF,
              url: 'https://example.com/cheatsheet.pdf',
              mimeType: 'application/pdf',
            },
            {
              id: 'attachment-2',
              name: 'example.js',
              description: null,
              content: 'export const sum = (a, b) => a + b;',
              type: AttachmentType.CODE,
              url: 'https://example.com/example.js',
              mimeType: 'text/javascript',
            },
          ],
          transcript: {
            id: 'transcript-1',
            content: 'Welcome to this lecture about React.\nWe will cover components and state.',
            source: 'manual',
          },
        },
        {
          id: 'lecture-2',
          title: 'Quiz: React Hooks',
          description: 'Test your knowledge',
          content: `
Learning objectives:
- Understand useState
- Understand useEffect

Question 1: What hook manages state?
Correct answer: useState
`,
          type: LectureType.QUIZ,
          attachments: [],
          transcript: null,
        },
      ],
    },
  ],
};

describe('text-normalizer', () => {
  it('removes duplicated whitespace and unsafe characters', () => {
    const result = normalizeKnowledgeText('Hello   world\u0001\n\nTest');
    assert.equal(result, 'Hello world\n\nTest');
  });

  it('strips invalid HTML while preserving plain text', () => {
    const result = normalizeKnowledgeText('<p>Hello <strong>world</strong></p>');
    assert.equal(result, 'Hello world');
  });

  it('preserves markdown headings and code blocks', () => {
    const input = '# Title\n\nParagraph\n\n```js\ncode();\n```';
    const result = normalizeKnowledgeText(input, { preserveMarkdown: true });
    assert.match(result ?? '', /# Title/);
    assert.match(result ?? '', /```js/);
  });

  it('detects markdown and rich text formats', () => {
    assert.equal(detectContentFormat('# Heading'), 'markdown');
    assert.equal(detectContentFormat('<p>Hello</p>'), 'rich_text');
    assert.equal(detectContentFormat('Plain text'), 'plain');
  });

  it('computes stable content hashes', () => {
    const hashA = computeContentHash('same content');
    const hashB = computeContentHash('same content');
    const hashC = computeContentHash('different content');
    assert.equal(hashA, hashB);
    assert.notEqual(hashA, hashC);
  });
});

describe('content-hash change detection', () => {
  it('detects unchanged content', () => {
    const text = 'Stable lecture content';
    const hash = computeContentHash(text);
    const result = detectContentChange({
      sourceId: 'lecture:1:content',
      normalizedText: text,
      existingHash: hash,
    });

    assert.equal(result.hasChanged, false);
  });

  it('detects changed content', () => {
    const result = detectContentChange({
      sourceId: 'lecture:1:content',
      normalizedText: 'Updated content',
      existingHash: computeContentHash('Old content'),
    });

    assert.equal(result.hasChanged, true);
  });
});

describe('content-collector', () => {
  it('collects all supported lesson resource types', () => {
    const { sources, stats } = collectCourseKnowledgeSources(sampleCourse);

    assert.ok(stats.sourcesCollected >= 8);
    assert.ok(sources.some((source) => source.sourceType === 'course_overview'));
    assert.ok(sources.some((source) => source.sourceType === 'lesson_title'));
    assert.ok(sources.some((source) => source.sourceType === 'markdown_content'));
    assert.ok(sources.some((source) => source.sourceType === 'video_transcript'));
    assert.ok(sources.some((source) => source.sourceType === 'pdf_document'));
    assert.ok(sources.some((source) => source.sourceType === 'code_example'));
    assert.ok(sources.some((source) => source.sourceType === 'quiz'));
  });

  it('scopes lecture collection to a single lesson', () => {
    const { sources } = collectLectureKnowledgeSources(sampleCourse, 'lecture-1');
    assert.ok(sources.every((source) => source.lessonId === 'lecture-1'));
    assert.equal(
      sources.some((source) => source.sourceType === 'course_overview'),
      false,
    );
  });
});

describe('extractors', () => {
  it('extracts markdown lecture content', async () => {
    const result = await markdownContentExtractor.extract({
      courseId: 'course-1',
      lessonId: 'lecture-1',
      sourceType: 'markdown_content',
      sourceId: 'lecture:lecture-1:content',
      title: 'Content',
      language: 'en',
      content: '# React\n\nComponent-based UI',
    });

    assert.equal(isExtractionSkipped(result), false);
    if (!isExtractionSkipped(result)) {
      assert.match(result.text, /React/);
    }
  });

  it('skips empty transcripts', async () => {
    const result = await transcriptExtractor.extract({
      courseId: 'course-1',
      lessonId: 'lecture-1',
      sourceType: 'video_transcript',
      sourceId: 'transcript:1',
      title: 'Transcript',
      language: 'en',
      content: '   ',
    });

    assert.equal(isExtractionSkipped(result), true);
  });
});

describe('chunk generation', () => {
  it('chunks markdown without breaking fenced code blocks', () => {
    const markdown = [
      '# Section 1',
      'Paragraph one with enough content to pass minimum chunk requirements for indexing.',
      '```js',
      'function hello() { return "world"; }',
      '```',
      '# Section 2',
      'Paragraph two with enough content to pass minimum chunk requirements for indexing.',
    ].join('\n\n');

    const chunks = chunkMarkdownContent(markdown);
    assert.ok(chunks.length >= 1);
    assert.ok(chunks.some((chunk) => chunk.content.includes('```js')));
  });

  it('includes total chunk metadata', () => {
    const longText = Array.from({ length: 40 }, (_, index) =>
      `Paragraph ${index} with enough words to force chunking in the knowledge ingestion pipeline.`,
    ).join('\n\n');

    const chunks = chunkContentByKind(longText, 'default');
    assert.ok(chunks.length > 1);
    assert.equal(chunks[0]?.totalChunks, chunks.length);
  });
});

describe('chunk builder', () => {
  it('builds searchable chunk records with metadata', () => {
    const records = buildKnowledgeChunkRecords(
      {
        courseId: 'course-1',
        sectionId: 'section-1',
        lessonId: 'lecture-1',
        sourceType: 'markdown_content',
        sourceId: 'lecture:lecture-1:content',
        title: 'React Basics',
        language: 'en',
        lectureType: LectureType.TEXT,
      },
      '# React\n\nReact is a UI library used to build component-based applications with reusable components, hooks, and a declarative rendering model.',
    );

    assert.ok(records.length >= 1);
    assert.equal(records[0]?.sourceId, 'lecture:lecture-1:content');
    assert.equal(records[0]?.metadata?.sourceType, 'markdown_content');
    assert.equal(records[0]?.metadata?.language, 'en');
  });
});

describe('knowledge ingestion pipeline orchestration', () => {
  function createInMemoryDeps() {
    const hashes = new Map<string, string>();
    const chunks: Array<{ sourceId: string; content: string; embedding: number[] }> =
      [];

    const hashRepository: KnowledgeSourceHashRepositoryPort = {
      async findBySourceId(sourceId) {
        const contentHash = hashes.get(sourceId);
        if (!contentHash) {
          return null;
        }

        return {
          sourceId,
          courseId: 'course-1',
          contentHash,
          updatedAt: new Date(),
        };
      },
      async findByCourseId() {
        return [...hashes.entries()].map(([sourceId, contentHash]) => ({
          sourceId,
          courseId: 'course-1',
          contentHash,
          updatedAt: new Date(),
        }));
      },
      async findByLectureId(lectureId) {
        return [...chunks]
          .filter((chunk) => chunk.sourceId.includes(lectureId))
          .map((chunk) => ({
            sourceId: chunk.sourceId,
            courseId: 'course-1',
            lectureId,
            contentHash: hashes.get(chunk.sourceId) ?? '',
            updatedAt: new Date(),
          }));
      },
      async upsert(record) {
        hashes.set(record.sourceId, record.contentHash);
      },
      async deleteBySourceIds(sourceIds) {
        for (const sourceId of sourceIds) {
          hashes.delete(sourceId);
        }
        return sourceIds.length;
      },
      async deleteByCourseId() {
        const count = hashes.size;
        hashes.clear();
        return count;
      },
      async deleteByLectureId() {
        return 0;
      },
    };

    const knowledgeChunkRepository: KnowledgeChunkRepositoryPort = {
      async deleteByCourseId() {
        const count = chunks.length;
        chunks.length = 0;
        return count;
      },
      async deleteByLectureId() {
        return 0;
      },
      async deleteBySourceId(sourceId) {
        const before = chunks.length;
        const remaining = chunks.filter((chunk) => chunk.sourceId !== sourceId);
        chunks.length = 0;
        chunks.push(...remaining);
        return before - chunks.length;
      },
      async deleteBySourceIds(sourceIds) {
        const before = chunks.length;
        const remaining = chunks.filter(
          (chunk) => !sourceIds.includes(chunk.sourceId),
        );
        chunks.length = 0;
        chunks.push(...remaining);
        return before - remaining.length;
      },
      async countByCourseId() {
        return chunks.length;
      },
      async insertMany(records) {
        for (const record of records) {
          chunks.push({
            sourceId: record.sourceId,
            content: record.content,
            embedding: record.embedding,
          });
        }
      },
      async markCourseIndexed() {},
    };

    const embeddingPort: EmbeddingPort = {
      async generateEmbedding(text) {
        return {
          text,
          embedding: Array.from({ length: 1536 }, () => text.length % 7),
          dimensions: 1536,
          model: 'test-embedding',
        };
      },
      async generateBatchEmbeddings(texts) {
        const embeddings = await Promise.all(
          texts.map((text) => embeddingPort.generateEmbedding(text)),
        );
        return {
          embeddings,
          totalTokensUsed: texts.length,
        };
      },
      getDimensions() {
        return 1536;
      },
    };

    return {
      deps: {
        hashRepository,
        knowledgeChunkRepository,
        embeddingPort,
      },
      hashes,
      chunks,
    };
  }

  it('indexes a complete course with multiple content types', async () => {
    const { deps, chunks } = createInMemoryDeps();

    const result = await ingestCourseKnowledge(sampleCourse, deps);

    assert.ok(result.sourcesCollected > 0);
    assert.ok(result.sourcesExtracted > 0);
    assert.ok(result.chunksIndexed > 0);
    assert.ok(chunks.length > 0);
  });

  it('skips embeddings when content is unchanged on reindex', async () => {
    const { deps, chunks } = createInMemoryDeps();

    const first = await ingestCourseKnowledge(sampleCourse, deps);
    const chunkCountAfterFirst = chunks.length;

    const second = await ingestCourseKnowledge(sampleCourse, deps);

    assert.ok(first.chunksIndexed > 0);
    assert.equal(second.sourcesUnchanged, second.sourcesExtracted);
    assert.equal(second.chunksIndexed, 0);
    assert.equal(chunks.length, chunkCountAfterFirst);
  });

  it('reindexes only changed lecture resources', async () => {
    const { deps, chunks } = createInMemoryDeps();

    await ingestCourseKnowledge(sampleCourse, deps);
    const initialChunkCount = chunks.length;

    const updatedCourse: CourseForIndexingDTO = {
      ...sampleCourse,
      sections: sampleCourse.sections.map((section) => ({
        ...section,
        lectures: section.lectures.map((lecture) =>
          lecture.id === 'lecture-1'
            ? {
                ...lecture,
                content:
                  '# Updated React Content\n\nThis lecture now includes new material about hooks and context providers for state management.',
              }
            : lecture,
        ),
      })),
    };

    const lectureResult = await ingestLectureKnowledge(
      updatedCourse,
      'lecture-1',
      deps,
    );

    assert.ok(lectureResult.chunksIndexed > 0);
    assert.ok(chunks.length >= initialChunkCount);
  });
});
