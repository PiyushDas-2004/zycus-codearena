import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  children: string;
  className?: string;
  /**
   * Candidate-facing content renders links as plain text so nothing can navigate away from or open
   * windows over the test. Admin previews may allow them (they open in a new tab with noopener).
   */
  allowLinks?: boolean;
}

/**
 * The ONLY way to render question statements, instructions and notes. Raw HTML in the source is
 * dropped (`skipHtml`), the resulting tree is sanitised with rehype-sanitize's GitHub-style
 * allow-list, and images are not rendered at all (no external requests, no tracking pixels).
 */
export function Markdown({ children, className, allowLinks = false }: MarkdownProps) {
  const components: ComponentProps<typeof ReactMarkdown>['components'] = {
    a: ({ children: text, href }) =>
      allowLinks && href && /^https:\/\//.test(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer nofollow">
          {text}
        </a>
      ) : (
        <span className="underline decoration-dotted underline-offset-2">{text}</span>
      ),
    pre: ({ children: code }) => (
      <pre className="my-3 overflow-x-auto rounded-md border border-border bg-surface-sunken px-4 py-3 font-mono text-[13px] leading-relaxed text-strong">
        {code}
      </pre>
    ),
    code: ({ children: code, className: cls }) => (
      <code
        className={clsx(
          'font-mono text-[0.9em]',
          !cls && 'rounded-sm bg-surface-sunken px-1 py-0.5 text-strong',
        )}
      >
        {code}
      </code>
    ),
    table: ({ children: rows }) => (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{rows}</table>
      </div>
    ),
    th: ({ children: c }) => (
      <th className="border border-border bg-surface-sunken px-3 py-1.5 text-left font-semibold">{c}</th>
    ),
    td: ({ children: c }) => <td className="border border-border px-3 py-1.5 align-top">{c}</td>,
    blockquote: ({ children: c }) => (
      <blockquote className="my-3 border-l-4 border-info-border bg-surface-tint px-4 py-2 text-strong">
        {c}
      </blockquote>
    ),
  };

  return (
    <div className={clsx('markdown', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        disallowedElements={['img']}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
