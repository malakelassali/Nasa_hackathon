/** Shared policy for the static showcase. Keep hosting and preview in sync. */
const directives = [
  "default-src 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self'",
  "style-src-attr 'none'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'none'",
  "media-src 'none'",
  "worker-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
];

export const CSP = directives.join('; ');

// Browsers only support frame-ancestors in an HTTP response header.
export const META_CSP = directives
  .filter((directive) => !directive.startsWith('frame-ancestors '))
  .join('; ');

// Vite injects its refresh preamble and styles during development. These
// exceptions never appear in the production policy. No unsafe-eval is needed.
export const DEV_CSP = directives
  .map((directive) => {
    if (directive === "script-src 'self'") return "script-src 'self' 'unsafe-inline'";
    if (directive === "style-src 'self'") return "style-src 'self' 'unsafe-inline'";
    if (directive === "connect-src 'none'") {
      return "connect-src 'self' ws://localhost:* ws://127.0.0.1:*";
    }
    return directive;
  })
  .join('; ');

export const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), display-capture=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
});

export const DEV_SECURITY_HEADERS = Object.freeze({
  ...SECURITY_HEADERS,
  'Content-Security-Policy': DEV_CSP,
});

/** Netlify/Cloudflare Pages-style static header configuration. */
export function serializeHeaders(headers = SECURITY_HEADERS) {
  return `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join('\n')}\n`;
}
