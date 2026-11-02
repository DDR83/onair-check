import test from 'node:test';
import assert from 'node:assert/strict';
import * as check from '../src/checks/legal-levels.js';
import { runFrameCheck, skip } from './helpers.js';

test('legal-levels: mid-range colours pass', { skip }, async () => {
  const r = await runFrameCheck(check, 'levels-ok.html');
  assert.equal(r.status, 'pass');
  assert.equal(r.metrics.outsideLegalPct, 0);
});

test('legal-levels: large pure white area fails (beyond R103)', { skip }, async () => {
  const r = await runFrameCheck(check, 'levels-white.html');
  assert.equal(r.status, 'fail');
  // 600x400 of 1920x1080
  assert.equal(r.metrics.outsideR103TolerancePct, 11.57);
  assert.deepEqual([r.regions[0].x, r.regions[0].y, r.regions[0].w, r.regions[0].h], [300, 300, 600, 400]);
});

test('legal-levels: luma 240 is over 235 but inside R103, so warn', { skip }, async () => {
  const r = await runFrameCheck(check, 'levels-slightly-hot.html');
  assert.equal(r.status, 'warn');
  assert.equal(r.metrics.outsideR103TolerancePct, 0);
});

test('legal-levels: transparent pixels are ignored (synthetic)', () => {
  const rgba = new Uint8Array(4 * 4); // all zero: transparent black
  const r = check.run({ frame: { rgba, width: 2, height: 2 } });
  assert.equal(r.status, 'pass');
});
