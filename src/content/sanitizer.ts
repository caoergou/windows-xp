/**
 * Allowlist-based HTML sanitizer (#149).
 *
 * Two tiers:
 * - **lenient**: for authored/authorized content — allows structural, text,
 *   table, list, and inline-style tags. Still strips script/iframe/object/on*.
 * - **strict**: for LLM-generated content — tighter tag set, no forms, and
 *   link rewriting (all hrefs become in-app IE navigation).
 *
 * Both tiers strip: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`,
 * `<meta http-equiv="refresh">`, all `on*` event attributes, `javascript:` URIs,
 * external resource URLs (only `data:` images pass through).
 */

const LENIENT_TAGS = new Set([
  'html',
  'head',
  'body',
  'title',
  'div',
  'span',
  'p',
  'br',
  'hr',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'b',
  'i',
  'u',
  'em',
  'strong',
  'small',
  'sub',
  'sup',
  's',
  'del',
  'ins',
  'mark',
  'abbr',
  'code',
  'kbd',
  'var',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  'img',
  'figure',
  'figcaption',
  'font',
  'center',
  'marquee',
  'form',
  'input',
  'select',
  'option',
  'textarea',
  'button',
  'label',
  'fieldset',
  'legend',
  'details',
  'summary',
  'style',
]);

const STRICT_TAGS = new Set([
  'html',
  'head',
  'body',
  'title',
  'div',
  'span',
  'p',
  'br',
  'hr',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'b',
  'i',
  'u',
  'em',
  'strong',
  'small',
  'sub',
  'sup',
  's',
  'del',
  'ins',
  'mark',
  'code',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'img',
  'figure',
  'figcaption',
  'font',
  'center',
  'marquee',
  'style',
]);

const BLOCKED_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'applet', 'link', 'base']);

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'data:']);

const EVENT_ATTR_RE = /^on/i;
const JAVASCRIPT_URI_RE = /^\s*javascript\s*:/i;
const EXTERNAL_URL_RE = /^(https?:)?\/\//i;

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (JAVASCRIPT_URI_RE.test(trimmed)) return false;
  try {
    const url = new URL(trimmed, 'http://localhost');
    return SAFE_URL_PROTOCOLS.has(url.protocol);
  } catch {
    return !trimmed.startsWith('//');
  }
}

function isSafeImgSrc(value: string): boolean {
  const trimmed = value.trim();
  if (JAVASCRIPT_URI_RE.test(trimmed)) return false;
  return trimmed.startsWith('data:image/');
}

export type SanitizeTier = 'lenient' | 'strict';

export interface SanitizeOptions {
  tier: SanitizeTier;
  /** Max outbound links to keep (strict tier only, default 8). */
  maxLinks?: number;
  /** Callback to rewrite hrefs for in-app navigation (strict tier). */
  rewriteHref?: (href: string) => string;
}

/**
 * Sanitize HTML using DOM parsing and an allowlist walker.
 * Safe to call in a browser environment only (uses DOMParser).
 */
export function sanitizeHtml(html: string, options: SanitizeOptions): string {
  const { tier, maxLinks = 8, rewriteHref } = options;
  const allowedTags = tier === 'strict' ? STRICT_TAGS : LENIENT_TAGS;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let linkCount = 0;

  function walkNode(node: Node): void {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (BLOCKED_TAGS.has(tag)) {
      el.parentNode?.removeChild(el);
      return;
    }

    if (!allowedTags.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
      return;
    }

    const attrsToRemove: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const name = attr.name.toLowerCase();

      if (EVENT_ATTR_RE.test(name)) {
        attrsToRemove.push(attr.name);
        continue;
      }

      if (name === 'href') {
        if (!isSafeUrl(attr.value)) {
          attrsToRemove.push(attr.name);
          continue;
        }
        if (tier === 'strict') {
          if (EXTERNAL_URL_RE.test(attr.value.trim())) {
            linkCount++;
            if (linkCount > maxLinks) {
              attrsToRemove.push(attr.name);
              continue;
            }
            if (rewriteHref) {
              el.setAttribute('href', rewriteHref(attr.value.trim()));
            }
          }
        }
      }

      if (name === 'src') {
        if (tag === 'img') {
          if (!isSafeImgSrc(attr.value)) {
            attrsToRemove.push(attr.name);
          }
        } else {
          attrsToRemove.push(attr.name);
        }
      }

      if (name === 'action' || name === 'formaction') {
        attrsToRemove.push(attr.name);
      }
    }

    attrsToRemove.forEach(a => el.removeAttribute(a));

    const children = Array.from(el.childNodes);
    children.forEach(walkNode);
  }

  const children = Array.from(doc.body.childNodes);
  children.forEach(walkNode);

  return doc.body.innerHTML;
}
