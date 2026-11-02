import test from 'node:test';
import assert from 'node:assert/strict';
import * as check from '../src/checks/interlace-flicker.js';
import { runFrameCheck, skip } from './helpers.js';

test('interlace-flicker: 1px line fails on 1080i50', { skip }, async () => {
  const r = await runFrameCheck(check, 'flicker-line.html', { format: '1080i50' });
  assert.equal(r.status, 'fail');
  assert.equal(r.regions[0].y, 500);
});

test('interlace-flicker: short 1px line only warns', { skip }, async () => {
  const r = await runFrameCheck(check, 'flicker-short.html', { format: '1080i50' });
  assert.equal(r.status, 'warn');
});

test('interlace-flicker: 4px line and solid box pass', { skip }, async () => {
  const r = await runFrameCheck(check, 'flicker-thick.html', { format: '1080i50' });
  assert.equal(r.status, 'pass');
});

test('interlace-flicker: skipped on progressive formats', { skip }, async () => {
  const r = await runFrameCheck(check, 'flicker-line.html', { format: '1080p50' });
  assert.equal(r.status, 'skip');
});
