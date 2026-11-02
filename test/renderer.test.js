import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { openPage } from '../src/renderer.js';
import { getFormat } from '../src/formats.js';
import { findBrowser } from '../src/browser.js';

const fx = (n) => fileURLToPath(new URL(`./fixtures/${n}`, import.meta.url));
const skip = findBrowser() ? false : 'no Chrome/Edge installed';
const px = (f, x, y) => [...f.rgba.slice((y * f.width + x) * 4, (y * f.width + x) * 4 + 4)];

test('renderer: transparent background, stepped animation', { skip }, async () => {
  const s = await openPage(fx('box.html'), { format: getFormat('1080p50') });
  try {
    assert.equal(await s.endTime(), 1000);
    const f0 = await s.capture(0);
    assert.equal(f0.width, 1920);
    assert.deepEqual(px(f0, 10, 10), [0, 0, 0, 0]);
    assert.deepEqual(px(f0, 200, 150).slice(0, 3), [204, 0, 0]);
    assert.deepEqual(px(f0, 800, 150), [0, 0, 0, 0]);
    const f1 = await s.capture(1000);
    assert.deepEqual(px(f1, 800, 150).slice(0, 3), [204, 0, 0]);
    assert.deepEqual(px(f1, 200, 150), [0, 0, 0, 0]);
    assert.ok(f1.elements.some((e) => e.tag === 'div' && e.text === 'Hi'));
    assert.ok(s.usesAnimations());
  } finally {
    await s.close();
  }
});
