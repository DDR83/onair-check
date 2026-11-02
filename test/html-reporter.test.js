import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderHtml } from '../src/reporters/html.js';
import { runChecks } from '../src/run.js';
import { main } from '../src/cli.js';
import { fixture, skip } from './helpers.js';

const report = {
  version: '0', target: '<x>', format: { name: '1080p50', width: 1920, height: 1080, interlaced: false }, times: [0],
  status: 'fail', summary: { pass: 0, warn: 0, fail: 1, skip: 0 }, images: [{ time: 0, png: Buffer.from('png') }],
  checks: [{ id: 'safe-areas', title: 'S', status: 'fail', message: 'bad <b>', frames: [{ time: 0, status: 'fail', message: 'bad', regions: [{ x: 10, y: 20, w: 30, h: 40, label: 'text <i>', status: 'fail' }] }] }],
};

test('html: escapes content, embeds the frame and draws annotations', () => {
  const html = renderHtml(report);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(!html.includes('<x>') && html.includes('&lt;x&gt;'));
  assert.ok(html.includes('bad &lt;b&gt;'));
  assert.ok(html.includes('data:image/png;base64,' + Buffer.from('png').toString('base64')));
  assert.match(html, /<rect x="10" y="20" width="30" height="40"/);
});

test('html: end to end report from a real page', { skip }, async () => {
  const r = await runChecks(fixture('safe-text-out.html'), { at: '0' });
  const html = renderHtml(r);
  assert.match(html, /text outside title-safe/);
  assert.match(html, /data:image\/png;base64,iVBOR/);
});

test('cli: --html writes the file', { skip }, async () => {
  const file = path.join(os.tmpdir(), `onair-check-${process.pid}.html`);
  const sink = { write() {}, isTTY: false };
  await main([fixture('safe-ok.html'), '--at', '0', '--html', file], { stdout: sink, stderr: sink });
  try {
    assert.match(fs.readFileSync(file, 'utf8'), /onair-check report/);
  } finally {
    fs.rmSync(file, { force: true });
  }
});
