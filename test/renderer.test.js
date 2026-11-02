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

test('renderer: elements parked entirely off screen are not listed', { skip }, async () => {
  const s = await openPage(fx('offscreen.html'), { format: getFormat('1080p50') });
  try {
    const f = await s.capture(0);
    assert.deepEqual(f.elements.map((e) => e.selector), ['p#in']);
  } finally {
    await s.close();
  }
});

test('renderer: finished animations keep the state their finish handlers commit', { skip }, async () => {
  const s = await openPage(fx('commit-on-finish.html'), { format: getFormat('1080p50') });
  try {
    const f = await s.capture(2000);
    assert.deepEqual(px(f, 200, 150).slice(0, 3), [204, 0, 0]);
    assert.ok(f.elements.some((e) => e.text === 'Hi'));
  } finally {
    await s.close();
  }
});

test('renderer: a page seek hook drives the frame', { skip }, async () => {
  const s = await openPage(fx('seek-hook.html'), { format: getFormat('1080p50') });
  try {
    const f0 = await s.capture(0);
    assert.deepEqual(px(f0, 200, 150).slice(0, 3), [204, 0, 0]);
    const f1 = await s.capture(1000);
    assert.deepEqual(px(f1, 800, 150).slice(0, 3), [204, 0, 0]);
    assert.deepEqual(px(f1, 200, 150), [0, 0, 0, 0]);
    assert.ok(s.usesAnimations());
  } finally {
    await s.close();
  }
});
