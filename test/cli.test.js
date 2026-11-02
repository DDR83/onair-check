import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, main } from '../src/cli.js';
import { parseTimes, exitCode } from '../src/run.js';
import { renderConsole } from '../src/reporters/console.js';
import { renderJson } from '../src/reporters/json.js';
import { fixture, skip } from './helpers.js';

const sink = () => {
  let buf = '';
  return { write: (s) => (buf += s), get text() { return buf; }, isTTY: false };
};

test('parseArgs: flags and target', () => {
  const o = parseArgs(['a.html', '--format', '1080i50', '--at', '0,end', '--json', '--opaque', '--html', 'r.html']);
  assert.equal(o.target, 'a.html');
  assert.equal(o.format, '1080i50');
  assert.equal(o.json, true);
  assert.equal(o.expectTransparent, false);
  assert.equal(o.html, 'r.html');
  assert.throws(() => parseArgs(['--nope']), /Unknown option/);
  assert.throws(() => parseArgs(['--at']), /needs a value/);
});

test('parseTimes: sorts, dedupes and resolves end', () => {
  assert.deepEqual(parseTimes('500,0,end,500', 1000), [0, 500, 1000]);
  assert.deepEqual(parseTimes('0,end', 0), [0]);
  assert.throws(() => parseTimes('abc', 0), /Invalid time/);
});

test('exitCode: fail=1, warn depends on strict', () => {
  assert.equal(exitCode({ status: 'fail' }), 1);
  assert.equal(exitCode({ status: 'warn' }), 0);
  assert.equal(exitCode({ status: 'warn' }, { strict: true }), 1);
});

test('main: usage errors exit 2', async () => {
  const out = sink(), err = sink();
  assert.equal(await main([], { stdout: out, stderr: err }), 2);
  assert.equal(await main(['x.html', '--format', '720p'], { stdout: out, stderr: err }), 2);
  assert.match(err.text, /Unknown format/);
});

test('main: failing page exits 1 and prints JSON', { skip }, async () => {
  const out = sink(), err = sink();
  const code = await main([fixture('opaque-bg.html'), '--json', '--at', '0'], { stdout: out, stderr: err });
  assert.equal(code, 1);
  const report = JSON.parse(out.text);
  assert.equal(report.status, 'fail');
  assert.equal(report.checks.find((c) => c.id === 'transparency').status, 'fail');
  assert.equal(report.images, undefined);
});

test('main: clean page exits 0 and prints a console report', { skip }, async () => {
  const out = sink(), err = sink();
  const code = await main([fixture('safe-ok.html'), '--at', '0'], { stdout: out, stderr: err });
  assert.equal(code, 0, out.text);
  assert.match(out.text, /PASS {2}safe-areas/);
  assert.match(out.text, /SKIP {2}interlace-flicker/);
});

test('reporters render a minimal report', () => {
  const report = {
    version: '0', target: 't', format: { name: '1080p50', width: 1920, height: 1080, interlaced: false }, times: [0],
    status: 'fail', summary: { pass: 0, warn: 0, fail: 1, skip: 0 }, images: [{}],
    checks: [{ id: 'x', title: 'X', status: 'fail', message: 'bad', frames: [{ time: 0, status: 'fail', message: 'bad', regions: [{ x: 1, y: 2, w: 3, h: 4, label: 'r' }] }] }],
  };
  assert.match(renderConsole(report), /FAIL {2}x +bad\n.*@0ms r \[1,2 3x4\]/);
  assert.equal(JSON.parse(renderJson(report)).images, undefined);
});
