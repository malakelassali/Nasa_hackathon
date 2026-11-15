/** A conservative build-time boundary for local, static SVG image assets. */
export function inspectPublicSvg(source) {
  const problems = [];
  // No custom entities: they can obscure attribute values and trigger expansion.
  if (/<!DOCTYPE\b|<!ENTITY\b/i.test(source)) problems.push('DTD/entity declarations are forbidden');
  if (/<(?:[\w.-]+:)?(?:script|foreignObject)\b/i.test(source)) {
    problems.push('scripts and foreignObject content are forbidden');
  }
  if (/\son[\w:.-]+\s*=/i.test(source)) problems.push('event-handler attributes are forbidden');
  if (/\sstyle\s*=|<(?:[\w.-]+:)?style\b/i.test(source)) {
    problems.push('inline style attributes/elements are forbidden; use presentation attributes');
  }

  // Inspect URL-bearing attributes, not xmlns (the SVG namespace is an HTTP URL).
  const attributes = source.matchAll(/\b(?:(?:xlink:)?href|src)\s*=\s*(["'])([\s\S]*?)\1/gi);
  for (const [, , rawValue] of attributes) {
    const value = rawValue
      .replace(/&#(x[0-9a-f]+|\d+);?/gi, (_, code) => {
        const number = Number.parseInt(/^[xX]/.test(code) ? code.slice(1) : code, /^[xX]/.test(code) ? 16 : 10);
        return number <= 0x10ffff ? String.fromCodePoint(number) : '\uFFFD';
      })
      .replace(/&(?:Tab|NewLine);/g, '')
      .trim();
    // Fragments and local relative paths are supported; schemes, network paths
    // and control characters are not (including data: and javascript: URLs).
    if (/^[a-z][a-z\d+.-]*:|^[\\/]{2}|[\u0000-\u0020\u007f]/i.test(value)) {
      problems.push('URL attributes must reference a local asset or fragment');
      break;
    }
  }
  if (/url\(\s*['"]?(?!#)[a-z][a-z\d+.-]*:|url\(\s*['"]?[\\/]{2}|@import\b/i.test(source)) {
    problems.push('external CSS resources are forbidden');
  }
  return problems;
}
