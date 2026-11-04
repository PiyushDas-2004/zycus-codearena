import { describe, expect, it } from 'vitest';
import { cloudflareHeadersFile, contentSecurityPolicy, securityHeaders } from './securityHeaders';

const URL_ = 'https://abcdefghijklmnop.supabase.co';

describe('security headers', () => {
  it('allows only this site and the configured Supabase project', () => {
    const csp = contentSecurityPolicy(URL_);
    expect(csp).toContain(`connect-src 'self' ${URL_} wss://abcdefghijklmnop.supabase.co`);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });

  it('never allows JavaScript eval or inline scripts (WebAssembly only)', () => {
    const scriptSrc = contentSecurityPolicy(URL_)
      .split('; ')
      .find((d) => d.startsWith('script-src'));
    expect(scriptSrc).toBe("script-src 'self' 'wasm-unsafe-eval'");
  });

  it('limits powerful features and blocks framing', () => {
    const h = securityHeaders(URL_);
    expect(h['Permissions-Policy']).toContain('camera=(self)');
    expect(h['Permissions-Policy']).toContain('display-capture=()');
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['X-Robots-Tag']).toBe('noindex, nofollow');
  });

  it('writes a Cloudflare Pages _headers file', () => {
    const file = cloudflareHeadersFile(URL_);
    expect(file.split('\n')[1]).toBe('/*');
    expect(file).toContain('  Content-Security-Policy: ');
    expect(file).toContain('/assets/*\n  Cache-Control: public, max-age=31536000, immutable');
  });
});
