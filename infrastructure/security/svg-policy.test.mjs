import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectPublicSvg } from './svg-policy.mjs';

test('local SVG namespace, presentation attributes and fragment references are accepted', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path fill="url(#paint)" stroke="#285B3F"/><use xlink:href="#shape"/><image href="./local.png"/></svg>';
  assert.deepEqual(inspectPublicSvg(svg), []);
});

test('executable SVG content and inline CSS are rejected', () => {
  for (const content of [
    '<script href="/payload.js"/>',
    '<foreignObject><div>HTML</div></foreignObject>',
    '<path onLoad="alert(1)"/>',
    '<path style="fill:red"/>',
    '<style>path { fill:red }</style>',
  ]) {
    assert.ok(inspectPublicSvg(`<svg>${content}</svg>`).length > 0, content);
  }
});

test('remote and obfuscated URL references are rejected without banning xmlns', () => {
  for (const href of ['https://example.invalid/icon.svg', '//example.invalid/icon.svg', 'data:image/svg+xml,anything', 'javascript:alert(1)', '&#x68;ttps://example.invalid/icon.svg', 'java&#x09;script:alert(1)']) {
    assert.ok(inspectPublicSvg(`<svg><use href="${href}"/></svg>`).length > 0, href);
  }
  assert.ok(inspectPublicSvg('<svg><path fill="url(https://example.invalid/paint.svg)"/></svg>').length > 0);
  assert.ok(inspectPublicSvg('<!DOCTYPE svg [<!ENTITY remote "https://example.invalid/">]><svg/>').length > 0);
});
