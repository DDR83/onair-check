import test from 'node:test';
import assert from 'node:assert/strict';
import * as check from '../src/checks/transparency.js';
import { runFrameCheck, skip } from './helpers.js';

test('transparency: transparent page passes', { skip }, async () => {
  const r = await runFrameCheck(check, 'box.html');
  assert.equal(r.status, 'pass');
});

test('transparency: opaque body background fails', { skip }, async () => {
  const r = await runFrameCheck(check, 'opaque-bg.html');
  assert.equal(r.status, 'fail');
  assert.equal(r.metrics.transparentPct, 0);
});

test('transparency: skipped when opaque expected', () => {
  const r = check.run({ frame: { rgba: new Uint8Array(4), width: 1, height: 1 }, expectTransparent: false });
  assert.equal(r.status, 'skip');
});

test('transparency: mostly covered frame warns (synthetic pixels)', () => {
  const rgba = new Uint8Array(100 * 4).fill(255);
  rgba[3] = 0;
  rgba[7] = 0;
  const r = check.run({ frame: { rgba, width: 10, height: 10 } });
  assert.equal(r.status, 'warn');
});
