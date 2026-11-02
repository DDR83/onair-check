import fs from 'node:fs';
import { getFormat } from './formats.js';
import { openPage } from './renderer.js';
import { CHECKS, worst } from './checks/index.js';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** Parse "0,500,end" into a sorted, unique list of ms values; "end" resolves to endMs. */
export function parseTimes(spec, endMs) {
  const out = new Set();
  for (const part of String(spec).split(',').map((s) => s.trim()).filter(Boolean)) {
    if (part === 'end') out.add(endMs);
    else if (/^\d+(\.\d+)?$/.test(part)) out.add(Number(part));
    else throw new Error(`Invalid time "${part}" in --at. Use milliseconds or "end".`);
  }
  if (!out.size) throw new Error('--at needs at least one time.');
  return [...out].sort((a, b) => a - b);
}

/**
 * Render the target at each time and run every check.
 * Returns a report object; `images` holds the PNG of each frame (omitted from JSON output).
 */
export async function runChecks(target, { format = '1080p50', at = '0,end', expectTransparent = true, browserPath } = {}) {
  const fmt = getFormat(format);
  const session = await openPage(target, { format: fmt, browserPath });
  try {
    const times = parseTimes(at, await session.endTime());
    const frameChecks = CHECKS.filter((c) => c.scope === 'frame');
    const pageChecks = CHECKS.filter((c) => c.scope === 'page');
    const results = new Map(CHECKS.map((c) => [c.id, []]));
    const images = [];
    for (const t of times) {
      const frame = await session.capture(t);
      images.push({ time: t, png: frame.png });
      for (const c of frameChecks) {
        results.get(c.id).push({ time: t, ...c.run({ format: fmt, frame, expectTransparent }) });
      }
    }
    for (const c of pageChecks) {
      results.get(c.id).push({ time: null, ...c.run({ format: fmt, requests: session.requests }) });
    }
    const checks = CHECKS.map((c) => {
      const frames = results.get(c.id);
      const status = worst(frames.map((f) => f.status));
      const rep = frames.find((f) => f.status === status) || frames[0];
      return { id: c.id, title: c.title, scope: c.scope, status, message: rep.message, frames };
    });
    const summary = { pass: 0, warn: 0, fail: 0, skip: 0 };
    for (const c of checks) summary[c.status]++;
    return {
      tool: 'onair-check',
      version: pkg.version,
      target,
      format: { name: fmt.name, width: fmt.width, height: fmt.height, interlaced: fmt.interlaced },
      times,
      status: worst(checks.map((c) => c.status)),
      summary,
      checks,
      images,
    };
  } finally {
    await session.close();
  }
}

/** Process exit code: 1 on any fail (or any warn with strict), else 0. */
export function exitCode(report, { strict = false } = {}) {
  if (report.status === 'fail') return 1;
  if (strict && report.status === 'warn') return 1;
  return 0;
}
