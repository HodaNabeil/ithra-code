import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AttachmentType } from '@/generated/prisma/enums';
import { extractAttachmentText } from '@/ai-platform/indexing/services/attachment-content-extractor.service';

describe('attachment-content-extractor', () => {
  it('uses inline content when available', async () => {
    const result = await extractAttachmentText({
      id: 'att-1',
      name: 'notes.txt',
      type: AttachmentType.TEXT,
      url: 'https://example.com/notes.txt',
      content: 'Inline lecture notes',
    });

    assert.equal(result.skipped, false);
    assert.equal(result.text, 'Inline lecture notes');
    assert.equal(result.extractionMethod, 'inline_content');
  });

  it('skips unsupported binary attachment types gracefully', async () => {
    const result = await extractAttachmentText({
      id: 'att-2',
      name: 'diagram.png',
      type: AttachmentType.IMAGE,
      url: 'https://example.com/diagram.png',
    });

    assert.equal(result.skipped, true);
    assert.equal(result.text, null);
    assert.match(result.skipReason ?? '', /unsupported_attachment_type:IMAGE/);
  });

  it('skips office attachments without inline text', async () => {
    const result = await extractAttachmentText({
      id: 'att-3',
      name: 'slides.pptx',
      type: AttachmentType.PPTX,
      url: 'https://example.com/slides.pptx',
    });

    assert.equal(result.skipped, true);
    assert.equal(result.skipReason, 'office_format_requires_inline_content');
  });
});
