import test from 'node:test';
import assert from 'node:assert/strict';
import { getFormat, safeRect } from '../src/formats.js';
import { luma709, contrastRatio, over, parseCssColor } from '../src/color.js';
import { encodePng, decodePng } from '../src/png.js';

test('formats: known and unknown', () => {
  const f = getFormat('1080i50');
  assert.equal(f.interlaced, true);
  assert.equal(f.width, 1920);
  assert.throws(() => getFormat('720p'), /Unknown format/);
});

test('safeRect: 93% action safe on 1920x1080', () => {
  const r = safeRect(getFormat('1080p50'), 'action');
  assert.equal(Math.round(r.x), 67);
  assert.equal(Math.round(r.y), 38);
  assert.equal(Math.round(r.w), 1786);
});

test('luma709 endpoints', () => {
  assert.equal(luma709(0, 0, 0), 0);
  assert.ok(Math.abs(luma709(255, 255, 255) - 255) < 1e-9);
});

test('contrast: black on white is 21', () => {
  assert.ok(Math.abs(contrastRatio([0, 0, 0], [255, 255, 255]) - 21) < 1e-9);
  assert.equal(contrastRatio([10, 10, 10], [10, 10, 10]), 1);
});

test('over and parseCssColor', () => {
  assert.deepEqual(over([255, 0, 0], 0.5, [0, 0, 0]), [127.5, 0, 0]);
  assert.deepEqual(parseCssColor('rgba(1, 2, 3, 0.5)'), { rgb: [1, 2, 3], a: 0.5 });
  assert.equal(parseCssColor('transparent').a, 0);
});

test('png round trip', () => {
  const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 9, 8, 7, 6]);
  const out = decodePng(encodePng(rgba, 2, 2));
  assert.equal(out.width, 2);
  assert.deepEqual([...out.data], [...rgba]);
});
