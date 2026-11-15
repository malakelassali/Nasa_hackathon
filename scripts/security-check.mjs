import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, DEV_CSP, META_CSP, SECURITY_HEADERS, serializeHeaders } from '../infrastructure/security/headers.mjs';
import { inspectPublicSvg } from '../infrastructure/security/svg-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const report = (file, message) => failures.push(`${relative(root, file)}: ${message}`);
const read = (file) => readFileSync(file, 'utf8');

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return entry.isFile() ? [path] : [];
  });
}

const forbiddenCode = [
  [/\bdangerouslySetInnerHTML\b|\.(?:innerHTML|outerHTML)\s*=|\.insertAdjacentHTML\s*\(/, 'render text through React; raw HTML sinks are outside the showcase scope'],
  [/\beval\s*\(|\bnew\s+Function\s*\(/, 'dynamic code execution is forbidden'],
  [/\bfetch\s*\(|\bXMLHttpRequest\b|\bnew\s+(?:WebSocket|EventSource)\s*\(|\bsendBeacon\s*\(/, 'network services must remain simulated'],
  [/\b(?:getCurrentPosition|watchPosition|getUserMedia|getDisplayMedia)\s*\(|\b(?:MediaRecorder|SpeechRecognition|webkitSpeechRecognition)\b/, 'device and speech access must remain simulated'],
  [/\bnavigator\s*\.\s*(?:geolocation|mediaDevices|permissions)\b/, 'do not request or query device permissions in this showcase'],
  [/\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\s*\.\s*cookie\b/, 'showcase state must remain in memory'],
  [/\bprocess\s*\.\s*env\b|\bimport\s*\.\s*meta\s*\.\s*env\s*\[/, 'do not expose environment values in client code'],
  [/\bimport\s*\.\s*meta\s*\.\s*env\s*\.\s*(?!(?:DEV|PROD|MODE|BASE_URL)\b)\w+/, 'client environment values require a deliberate security review'],
  [/(?:\bfrom\s*|\bimport\s*\(?\s*)['"](?:https?:)?\/\//, 'bundle dependencies locally; remote module imports are forbidden'],
  [/\bstyle\s*=\s*\{/, 'use CSS classes; production CSP rejects inline styles'],
  [/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/, 'private key material must never enter client code'],
];

const sourceFiles = ['apps/web/src', 'packages/ui/src']
  .flatMap((directory) => filesUnder(join(root, directory)))
  .filter((file) => ['.ts', '.tsx', '.js', '.jsx', '.css'].includes(extname(file)))
  .filter((file) => !/\.(?:test|spec)\.[^.]+$/.test(file));

for (const file of sourceFiles) {
  const content = read(file);
  if (extname(file) !== '.css') {
    for (const [pattern, message] of forbiddenCode) {
      if (pattern.test(content)) report(file, message);
    }
  }
  if (/url\(\s*['"]?(?:https?:)?\/\/|@import\s*['"](?:https?:)?\/\//i.test(content)) {
    report(file, 'serve images, fonts and styles from this app; remote assets are blocked by CSP');
  }
  if (/\b(?:src|poster)\s*=\s*(?:\{\s*)?['"](?:https?:)?\/\//i.test(content)) {
    report(file, 'serve media assets locally; remote assets are blocked by CSP');
  }
}

const svgFiles = filesUnder(join(root, 'apps/web/public'))
  .filter((file) => extname(file).toLowerCase() === '.svg');
for (const file of svgFiles) {
  for (const problem of inspectPublicSvg(read(file))) report(file, problem);
}

try {
  assert.ok(sourceFiles.length > 0, 'application sources must exist');
  for (const required of ["default-src 'none'", "connect-src 'none'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'"]) {
    assert.ok(CSP.split('; ').includes(required), `production CSP must contain ${required}`);
  }
  assert.ok(!/unsafe-inline|unsafe-eval|\*/.test(CSP), 'production CSP must not contain inline/eval/wildcard exceptions');
  assert.ok(!DEV_CSP.includes('unsafe-eval'), 'development must not allow eval');
  for (const permission of ['camera=()', 'microphone=()', 'geolocation=()']) {
    assert.ok(SECURITY_HEADERS['Permissions-Policy'].includes(permission), `${permission} must remain disabled`);
  }
  assert.equal(SECURITY_HEADERS['X-Content-Type-Options'], 'nosniff');
  assert.equal(SECURITY_HEADERS['X-Frame-Options'], 'DENY');
  assert.equal(read(join(root, 'infrastructure/security/_headers')), serializeHeaders(), 'hosting header example has drifted; regenerate it from headers.mjs');
} catch (error) {
  failures.push(`Security policy: ${error.message}`);
}

// Ignore untracked developer files. This check never prints file contents.
try {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
  for (const file of tracked) {
    if (/(^|\/)\.env(?:\.|$)/.test(file) && !/\.env\.example$/.test(file)) {
      report(join(root, file), 'environment files must not be tracked; use an empty .env.example');
    }
  }
} catch {
  failures.push('Could not inspect tracked environment files with git ls-files.');
}

if (process.argv.includes('--built')) {
  const output = join(root, 'apps/web/dist');
  try {
    assert.equal(read(join(output, '_headers')), serializeHeaders(), 'built _headers must match the shared policy');
    const html = read(join(output, 'index.html'));
    const meta = html.match(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]*)"[^>]*>/i);
    assert.ok(meta, 'built index.html must contain the production CSP meta fallback');
    const decoded = meta[1].replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&apos;', "'").replaceAll('&amp;', '&');
    assert.equal(decoded, META_CSP, 'built meta CSP must match the shared production fallback');
    assert.ok(!/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(html), 'built HTML must not contain inline executable scripts');
    assert.ok(!/<style\b|\sstyle\s*=/i.test(html), 'built HTML must not contain inline styles');
    assert.ok(!/\b(?:src|href)\s*=\s*["'](?:https?:)?\/\//i.test(html), 'built HTML must load only local assets');
    assert.ok(filesUnder(join(output, 'assets')).length > 0, 'built assets must exist');
  } catch (error) {
    failures.push(`Built showcase: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`Security boundary checks failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Security boundaries passed for ${sourceFiles.length} source files and ${svgFiles.length} SVG assets${process.argv.includes('--built') ? ' and the production build' : ''}.`);
}
