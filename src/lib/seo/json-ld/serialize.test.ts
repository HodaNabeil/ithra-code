import { describe, expect, it } from 'vitest';

import { serializeJsonLd } from './serialize';

describe('serializeJsonLd', () => {
  it('escapes script-breakout characters', () => {
    const payload = {
      name: '</script><script>alert(1)</script>',
    };

    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c');
    expect(JSON.parse(serialized)).toEqual(payload);
  });

  it('produces valid JSON for nested objects', () => {
    const payload = {
      '@type': 'Course',
      offers: { price: 99, currency: 'USD' },
    };

    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });
});
