import test from 'node:test';
import assert from 'node:assert/strict';
import * as check from '../src/checks/safe-areas.js';
import { runFrameCheck, skip } from './helpers.js';

test('safe-areas: graphic inside title-safe passes', { skip }, async () => {
  const r = await runFrameCheck(check, 'safe-ok.html');
  assert.equal(r.status, 'pass');
});

test('safe-areas: text near the edge fails', { skip }, async () => {
  const r = await runFrameCheck(check, 'safe-text-out.html');
  assert.equal(r.status, 'fail');
  assert.equal(r.metrics.textOutsideTitleSafe, 1);
  assert.match(r.regions[0].label, /div\.t/);
});

test('safe-areas: bar bleeding past action-safe warns', { skip }, async () => {
  const r = await runFrameCheck(check, 'safe-graphic-out.html');
  assert.equal(r.status, 'warn');
});

test('safe-areas: full-frame background is ignored', () => {
  const frame = { elements: [{ selector: 'div.bg', rect: { x: 0, y: 0, w: 1920, h: 1080 }, textRect: null, hasBg: true }] };
  const r = check.run({ format: { width: 1920, height: 1080 }, frame });
  assert.equal(r.status, 'pass');
});
