import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { clearPromptCache } from '../cache/prompt-cache';
import { resolvePrompt, resolvePromptSync, resetPromptResolverForTests } from '../resolver';

describe('prompt resolver', () => {
  it('resolves local tutor system prompt in Arabic', () => {
    const prompt = resolvePromptSync('tutor/system', 'ar');
    assert.ok(prompt.content.includes('IthraCode'));
    assert.equal(prompt.version, 'local-v1');
    assert.equal(prompt.source, 'local');
  });

  it('substitutes template variables for rubric prompt', () => {
    const prompt = resolvePromptSync('evaluator/rubric', 'en', {
      criteriaText: '- c1: Clarity (max 10)',
      submission: 'Student answer here',
    });
    assert.ok(prompt.content.includes('Clarity'));
    assert.ok(prompt.content.includes('Student answer here'));
  });

  it('caches async resolved prompts', async () => {
    resetPromptResolverForTests();
    clearPromptCache();
    const first = await resolvePrompt('tutor/system', { locale: 'en' });
    const second = await resolvePrompt('tutor/system', { locale: 'en' });
    assert.equal(first.content, second.content);
    assert.equal(second.source, 'cache');
  });
});
