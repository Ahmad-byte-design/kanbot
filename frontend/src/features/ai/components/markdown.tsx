import { Fragment, type ReactNode } from 'react';

/**
 * A deliberately small Markdown renderer for assistant replies.
 *
 * It covers what the API actually produces — headings, emphasis, inline and
 * fenced code, links, quotes, ordered/unordered lists and rules — and builds
 * React elements instead of injecting HTML, so model output can never become a
 * script tag. Anything it does not understand stays visible as plain text.
 */

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|~~[^~\n]+~~|\[[^\]]+\]\([^)\s]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;

const SAFE_LINK = /^(https?:\/\/|\/|#|mailto:)/i;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    index += 1;

    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('~~')) {
      nodes.push(<del key={key}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      const href = link?.[2] ?? '';
      nodes.push(
        link && SAFE_LINK.test(href) ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-tone underline underline-offset-2"
          >
            {link[1]}
          </a>
        ) : (
          token
        ),
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return nodes.map((node, nodeIndex) =>
    typeof node === 'string' ? <Fragment key={`${keyPrefix}-text-${nodeIndex}`}>{node}</Fragment> : node,
  );
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'font-display text-xl font-semibold tracking-tight text-foreground',
  2: 'font-display text-lg font-semibold tracking-tight text-foreground',
  3: 'font-display text-sm font-semibold tracking-tight text-foreground',
  4: 'text-sm font-semibold text-foreground',
  5: 'text-sm font-semibold text-foreground',
  6: 'text-xs font-semibold tracking-wide text-muted-foreground uppercase',
};

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;
const FENCE = /^\s*```(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

function isBlockStart(line: string): boolean {
  return (
    /^\s*#{1,6}\s+/.test(line) ||
    FENCE.test(line) ||
    RULE.test(line) ||
    /^\s*>\s?/.test(line) ||
    LIST_ITEM.test(line)
  );
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? '')) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      index += 1; // closing fence (or end of input)

      blocks.push(
        <pre
          key={`code-${index}`}
          className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 text-xs"
        >
          <code className="font-mono text-foreground">{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (RULE.test(line)) {
      blocks.push(<hr key={`rule-${index}`} className="border-border" />);
      index += 1;
      continue;
    }

    const heading = /^\s*(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      blocks.push(
        <p key={`heading-${index}`} className={HEADING_CLASSES[level]}>
          {inline(heading[2] ?? '', `heading-${index}`)}
        </p>,
      );
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? '')) {
        quote.push((lines[index] ?? '').replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="border-s-2 border-tone/50 ps-3 text-sm text-muted-foreground italic"
        >
          {inline(quote.join(' '), `quote-${index}`)}
        </blockquote>,
      );
      continue;
    }

    const firstItem = LIST_ITEM.exec(line);
    if (firstItem) {
      const ordered = /\d/.test(firstItem[1] ?? '');
      const items: string[] = [];

      while (index < lines.length) {
        const item = LIST_ITEM.exec(lines[index] ?? '');
        if (!item) break;
        items.push(item[2] ?? '');
        index += 1;
      }

      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag
          key={`list-${index}`}
          className={[
            'space-y-1 ps-5 text-sm leading-relaxed',
            ordered ? 'list-decimal' : 'list-disc',
          ].join(' ')}
        >
          {items.map((item, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`} className="ps-0.5">
              {inline(item, `item-${index}-${itemIndex}`)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() !== '' &&
      !(paragraph.length > 0 && isBlockStart(lines[index] ?? ''))
    ) {
      paragraph.push((lines[index] ?? '').trim());
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="text-sm leading-relaxed">
        {inline(paragraph.join(' '), `paragraph-${index}`)}
      </p>,
    );
  }

  return <div className="space-y-2.5 text-foreground">{blocks}</div>;
}
