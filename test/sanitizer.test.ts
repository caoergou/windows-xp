import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/content/sanitizer';
import type { SanitizeOptions } from '../src/content/sanitizer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const lenient = (overrides?: Partial<SanitizeOptions>): SanitizeOptions => ({
  tier: 'lenient',
  ...overrides,
});

const strict = (overrides?: Partial<SanitizeOptions>): SanitizeOptions => ({
  tier: 'strict',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Blocked tags — both tiers
// ---------------------------------------------------------------------------

describe('sanitizeHtml: blocked tags', () => {
  it.each(['lenient', 'strict'] as const)('strips <script> tags in %s tier', tier => {
    const html = '<div>hello</div><script>alert("xss")</script><p>world</p>';
    const result = sanitizeHtml(html, { tier });
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  it.each(['lenient', 'strict'] as const)('strips <iframe>, <object>, <embed> in %s tier', tier => {
    const html = '<iframe src="evil.html"></iframe><object data="x"></object><embed src="y">';
    const result = sanitizeHtml(html, { tier });
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });
});

// ---------------------------------------------------------------------------
// Event attributes
// ---------------------------------------------------------------------------

describe('sanitizeHtml: on* event attributes', () => {
  it.each(['lenient', 'strict'] as const)('strips on* event attributes in %s tier', tier => {
    const html = '<div onclick="alert(1)" onmouseover="hack()">text</div>';
    const result = sanitizeHtml(html, { tier });
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('text');
  });

  it('strips onerror on img tags', () => {
    const html = '<img onerror="alert(1)" src="data:image/png;base64,abc">';
    const result = sanitizeHtml(html, lenient());
    expect(result).not.toContain('onerror');
  });
});

// ---------------------------------------------------------------------------
// javascript: URIs
// ---------------------------------------------------------------------------

describe('sanitizeHtml: javascript: URIs', () => {
  it.each(['lenient', 'strict'] as const)('strips javascript: href in %s tier', tier => {
    const html = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(html, { tier });
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('strips javascript: with leading whitespace', () => {
    const html = '<a href="  javascript:void(0)">link</a>';
    const result = sanitizeHtml(html, strict());
    expect(result).not.toContain('javascript:');
  });
});

// ---------------------------------------------------------------------------
// Structural tags allowed
// ---------------------------------------------------------------------------

describe('sanitizeHtml: allowed structural tags', () => {
  it.each(['lenient', 'strict'] as const)('allows div, p, h1, table, ul in %s tier', tier => {
    const html =
      '<div><p>para</p><h1>heading</h1></div>' +
      '<table><tr><td>cell</td></tr></table>' +
      '<ul><li>item</li></ul>';
    const result = sanitizeHtml(html, { tier });
    expect(result).toContain('<div>');
    expect(result).toContain('<p>');
    expect(result).toContain('<h1>');
    expect(result).toContain('<table>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });
});

// ---------------------------------------------------------------------------
// Strict vs. lenient: form elements
// ---------------------------------------------------------------------------

describe('sanitizeHtml: form elements', () => {
  it('lenient tier keeps <form>, <input>, <select>', () => {
    const html = '<form><input type="text"><select><option>A</option></select></form>';
    const result = sanitizeHtml(html, lenient());
    expect(result).toContain('<form');
    expect(result).toContain('<input');
    expect(result).toContain('<select');
  });

  it('strict tier strips <form> (unwraps children into parent)', () => {
    const html = '<form><p>inside form</p></form>';
    const result = sanitizeHtml(html, strict());
    expect(result).not.toContain('<form');
    // Children of the unwrapped form are preserved.
    expect(result).toContain('<p>inside form</p>');
  });

  it('strict tier strips top-level <input> and <select>', () => {
    // When form elements are direct children of body they are walked and removed.
    const html = '<input type="text"><select><option>A</option></select>';
    const result = sanitizeHtml(html, strict());
    expect(result).not.toContain('<input');
    expect(result).not.toContain('<select');
    // The text content inside <option> survives (unwrapped).
    expect(result).toContain('A');
  });
});

// ---------------------------------------------------------------------------
// Image src handling
// ---------------------------------------------------------------------------

describe('sanitizeHtml: image src', () => {
  it('preserves data:image/* src on <img>', () => {
    const html = '<img src="data:image/png;base64,abc123">';
    const result = sanitizeHtml(html, strict());
    expect(result).toContain('data:image/png;base64,abc123');
  });

  it('strips external http src on <img>', () => {
    const html = '<img src="https://evil.com/tracker.png">';
    const result = sanitizeHtml(html, strict());
    expect(result).not.toContain('https://evil.com');
    // The <img> element itself remains, just without src.
    expect(result).toContain('<img');
  });

  it('strips non-image data: URIs', () => {
    const html = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(html, strict());
    expect(result).not.toContain('data:text/html');
  });
});

// ---------------------------------------------------------------------------
// Strict tier: maxLinks
// ---------------------------------------------------------------------------

describe('sanitizeHtml: maxLinks (strict tier)', () => {
  it('limits external links to maxLinks (default 8)', () => {
    const links = Array.from(
      { length: 12 },
      (_, i) => `<a href="https://site${i}.com">Link ${i}</a>`
    ).join('');
    const result = sanitizeHtml(links, strict());

    // First 8 links keep their href.
    for (let i = 0; i < 8; i++) {
      expect(result).toContain(`https://site${i}.com`);
    }
    // Links beyond 8 have href removed but the <a> element stays.
    for (let i = 8; i < 12; i++) {
      expect(result).not.toContain(`https://site${i}.com`);
      expect(result).toContain(`Link ${i}`);
    }
  });

  it('respects a custom maxLinks value', () => {
    const links = Array.from({ length: 5 }, (_, i) => `<a href="https://x${i}.com">L${i}</a>`).join(
      ''
    );
    const result = sanitizeHtml(links, strict({ maxLinks: 2 }));

    expect(result).toContain('https://x0.com');
    expect(result).toContain('https://x1.com');
    expect(result).not.toContain('https://x2.com');
    // Elements still present.
    expect(result).toContain('L2');
    expect(result).toContain('L3');
  });

  it('does not limit links in lenient tier', () => {
    const links = Array.from(
      { length: 12 },
      (_, i) => `<a href="https://site${i}.com">Link ${i}</a>`
    ).join('');
    const result = sanitizeHtml(links, lenient());
    for (let i = 0; i < 12; i++) {
      expect(result).toContain(`https://site${i}.com`);
    }
  });
});

// ---------------------------------------------------------------------------
// Strict tier: rewriteHref
// ---------------------------------------------------------------------------

describe('sanitizeHtml: rewriteHref (strict tier)', () => {
  it('applies rewriteHref callback to external links', () => {
    const html = '<a href="https://example.com/page">Example</a>';
    const result = sanitizeHtml(
      html,
      strict({
        rewriteHref: href => `ie://navigate?url=${encodeURIComponent(href)}`,
      })
    );
    expect(result).toContain('ie://navigate?url=https%3A%2F%2Fexample.com%2Fpage');
    expect(result).not.toContain('href="https://example.com/page"');
  });

  it('does not rewrite non-external links (relative, mailto)', () => {
    const html = '<a href="mailto:test@test.com">Mail</a><a href="/local">Local</a>';
    const rewritten: string[] = [];
    sanitizeHtml(
      html,
      strict({
        rewriteHref: href => {
          rewritten.push(href);
          return `rewritten:${href}`;
        },
      })
    );
    // Relative and mailto are not external (no https?://), so rewriteHref is not called.
    expect(rewritten).toEqual([]);
  });
});
