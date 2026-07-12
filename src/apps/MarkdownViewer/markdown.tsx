import React from 'react';

/**
 * A deliberately small, dependency-free Markdown → React renderer (#137).
 *
 * It covers the subset a blog post needs — ATX headings, paragraphs, ordered &
 * unordered lists, blockquotes, fenced & inline code, horizontal rules, and
 * inline bold/italic/code/links — and renders to real React elements (never
 * `dangerouslySetInnerHTML`), so untrusted post content can't inject markup.
 * Anything it doesn't recognize falls through as plain text. Keeping this in the
 * app (not a markdown library) is a deliberate choice against the size budget
 * (#113): the core package gains no heavyweight dependency.
 */

type Inline = React.ReactNode;

/** Parse inline spans: `code`, **bold**, *italic*, [text](url). */
function renderInline(text: string, keyPrefix: string): Inline[] {
  const nodes: Inline[] = [];
  let rest = text;
  let i = 0;
  // Ordered by precedence; code first so its contents aren't re-parsed.
  const patterns: { re: RegExp; make: (m: RegExpExecArray, key: string) => Inline }[] = [
    { re: /`([^`]+)`/, make: (m, key) => <code key={key}>{m[1]}</code> },
    {
      re: /\[([^\]]+)\]\(([^)\s]+)\)/,
      make: (m, key) => (
        <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      ),
    },
    {
      re: /\*\*([^*]+)\*\*|__([^_]+)__/,
      make: (m, key) => <strong key={key}>{m[1] ?? m[2]}</strong>,
    },
    {
      re: /\*([^*]+)\*|_([^_]+)_/,
      make: (m, key) => <em key={key}>{m[1] ?? m[2]}</em>,
    },
  ];

  while (rest.length > 0) {
    let best: { index: number; length: number; node: Inline } | null = null;
    for (const { re, make } of patterns) {
      const m = re.exec(rest);
      if (m && (best === null || m.index < best.index)) {
        best = { index: m.index, length: m[0].length, node: make(m, `${keyPrefix}-i${i++}`) };
      }
    }
    if (!best) {
      nodes.push(rest);
      break;
    }
    if (best.index > 0) nodes.push(rest.slice(0, best.index));
    nodes.push(best.node);
    rest = rest.slice(best.index + best.length);
  }
  return nodes;
}

/** Render a Markdown source string into a React fragment. */
export function renderMarkdown(src: string): React.ReactElement {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let k = 0;
  const key = () => `b${k++}`;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Blank line → skip.
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Fenced code block.
    if (/^```/.test(line.trim())) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push(
        <pre key={key()}>
          <code>{body.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Horizontal rule.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key()} />);
      i++;
      continue;
    }

    // ATX heading.
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const kk = key();
      blocks.push(<Tag key={kk}>{renderInline(heading[2], kk)}</Tag>);
      i++;
      continue;
    }

    // Blockquote (consecutive `>` lines).
    if (/^>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const kk = key();
      blocks.push(<blockquote key={kk}>{renderInline(body.join(' '), kk)}</blockquote>);
      continue;
    }

    // Unordered list.
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      const kk = key();
      blocks.push(
        <ul key={kk}>
          {items.map((it, idx) => (
            <li key={`${kk}-${idx}`}>{renderInline(it, `${kk}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list.
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      const kk = key();
      blocks.push(
        <ol key={kk}>
          {items.map((it, idx) => (
            <li key={`${kk}-${idx}`}>{renderInline(it, `${kk}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-block lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i++;
    }
    const kk = key();
    blocks.push(<p key={kk}>{renderInline(para.join(' '), kk)}</p>);
  }

  return <>{blocks}</>;
}
