import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

describe('Markdown (sanitised)', () => {
  it('renders formatting, code and tables', () => {
    const { container } = render(
      <Markdown>{'## Title\n\n**bold** `code`\n\n| a | b |\n|---|---|\n| 1 | 2 |'}</Markdown>,
    );
    expect(container.querySelector('h2')?.textContent).toBe('Title');
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('table')).not.toBeNull();
  });

  it('drops raw HTML, scripts, event handlers and javascript: URLs', () => {
    const evil = [
      '<script>window.pwned = 1</script>',
      '<img src=x onerror="window.pwned=2">',
      '<a href="javascript:alert(1)">click</a>',
      '[link](javascript:alert(1))',
      '<iframe src="https://example.com"></iframe>',
      '<div style="position:fixed" onclick="x()">overlay</div>',
    ].join('\n\n');
    const { container } = render(<Markdown allowLinks>{evil}</Markdown>);
    const html = container.innerHTML;
    expect(html).not.toMatch(/<script|onerror|onclick|javascript:|<iframe|style=/i);
    expect((window as unknown as { pwned?: number }).pwned).toBeUndefined();
  });

  it('never renders images (no external requests)', () => {
    const { container } = render(<Markdown>{'![tracker](https://example.com/pixel.png)'}</Markdown>);
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows links as inert text for candidates', () => {
    const { container } = render(<Markdown>{'[docs](https://example.com)'}</Markdown>);
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('docs');
  });
});
