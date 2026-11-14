import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { FormattedText } from '../../lib/text-formatter';
import { slugifyText } from '../../config/seo';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractMarkdownHeadings(content: string = ''): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = String(content || '').split(/\r?\n/);
  let inCode = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const text = h2[1].trim();
      headings.push({ id: slugifyText(text), text, level: 2 });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      const text = h3[1].trim();
      headings.push({ id: slugifyText(text), text, level: 3 });
    }
  }
  return headings;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-zinc-800 bg-[#08090c]">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language || 'code'}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  if (/\{\s*(?:bold|highlight)/i.test(text)) {
    return <FormattedText text={text} />;
  }

  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 font-mono text-[0.88em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const safeHref = /^https?:\/\//i.test(href) || href.startsWith('/') ? href : '#';
      return (
        <a
          key={idx}
          href={safeHref}
          target={safeHref.startsWith('http') ? '_blank' : undefined}
          rel={safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300 transition-colors"
        >
          {label}
        </a>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = String(content || '').split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(<CodeBlock key={`code-${keyCounter++}`} code={codeLines.join('\n')} language={lang} />);
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      const headingText = h2[1].trim();
      elements.push(
        <h2
          key={`h2-${keyCounter++}`}
          id={slugifyText(headingText)}
          className="text-xl sm:text-2xl font-bold text-white pt-6 pb-2 border-b border-zinc-800/80 scroll-mt-24"
        >
          {headingText}
        </h2>
      );
      i++;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      const headingText = h3[1].trim();
      elements.push(
        <h3
          key={`h3-${keyCounter++}`}
          id={slugifyText(headingText)}
          className="text-lg sm:text-xl font-bold text-emerald-300 pt-4 scroll-mt-24"
        >
          {headingText}
        </h3>
      );
      i++;
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s+/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`q-${keyCounter++}`}
          className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-zinc-200 italic text-sm sm:text-base"
        >
          {renderInlineMarkdown(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }

    if (/^(?:[-*]|\d+\.)\s+/.test(trimmed)) {
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      const listItems: string[] = [];
      while (i < lines.length && /^(?:[-*]|\d+\.)\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^(?:[-*]|\d+\.)\s+/, ''));
        i++;
      }
      const Tag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <Tag
          key={`list-${keyCounter++}`}
          className={`space-y-2 pl-5 text-zinc-300 text-sm sm:text-base leading-relaxed ${
            isOrdered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="marker:text-emerald-400">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </Tag>
      );
      continue;
    }

    elements.push(
      <p key={`p-${keyCounter++}`} className="text-sm sm:text-base text-zinc-300 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-4">{elements}</div>;
}
