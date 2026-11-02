import test from 'node:test';
import assert from 'node:assert/strict';
import * as size from '../src/checks/text-size.js';
import * as contrast from '../src/checks/text-contrast.js';
import * as network from '../src/checks/network.js';
import { runFrameCheck, runPageCheck, skip } from './helpers.js';

test('text-size: flags the 14px and 22px captions, not the 48px headline', { skip }, async () => {
  const r = await runFrameCheck(size, 'text-sizes.html');
  assert.equal(r.status, 'fail');
  const labels = r.regions.map((x) => `${x.status}:${x.label.split(': ')[1]}`).sort();
  assert.deepEqual(labels, ['fail:p#tiny', 'warn:p#mid']);
});

test('text-size: scales to 1080 on a 2160 frame', { skip }, async () => {
  // 48px at 2160 equals 24px at 1080: cap height 16.8, so a warning
  const r = await runFrameCheck(size, 'contrast-ok.html', { format: '2160p50' });
  assert.equal(r.status, 'warn');
});

test('text-contrast: white on navy passes', { skip }, async () => {
  const r = await runFrameCheck(contrast, 'contrast-ok.html');
  assert.equal(r.status, 'pass');
  assert.ok(r.metrics.worstRatio > 10);
});

test('text-contrast: grey on grey fails, text over transparency is not judged', { skip }, async () => {
  const r = await runFrameCheck(contrast, 'text-contrast.html');
  assert.equal(r.status, 'fail');
  assert.equal(r.regions.length, 1);
  assert.match(r.regions[0].label, /p#bad/);
  assert.equal(r.metrics.overTransparent, 1);
  assert.equal(r.metrics.judged, 2);
});

test('network: external font and script requests fail', { skip }, async () => {
  const r = await runPageCheck(network, 'external.html');
  assert.equal(r.status, 'fail');
  assert.equal(r.metrics.externalRequests, 2);
  assert.match(r.message, /fonts\.example\.invalid/);
});

test('network: self-contained page passes', { skip }, async () => {
  const r = await runPageCheck(network, 'box.html');
  assert.equal(r.status, 'pass');
});
