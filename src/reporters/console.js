const MARK = { pass: 'PASS', warn: 'WARN', fail: 'FAIL', skip: 'SKIP' };
const COLOR = { pass: 32, warn: 33, fail: 31, skip: 90 };

export function renderConsole(report, { color = false } = {}) {
  const paint = (s, code) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
  const f = report.format;
  const lines = [
    `onair-check ${report.version}  ${report.target}`,
    `${f.name} ${f.width}x${f.height}${f.interlaced ? ' interlaced' : ''}  frames at ${report.times.join(', ')} ms`,
    '',
  ];
  for (const c of report.checks) {
    lines.push(`${paint(MARK[c.status], COLOR[c.status])}  ${c.id.padEnd(18)} ${c.message}`);
    if (c.status === 'warn' || c.status === 'fail') {
      for (const fr of c.frames) {
        if (fr.status !== c.status) continue;
        const where = fr.time === null ? '' : `@${fr.time}ms `;
        for (const r of fr.regions || []) {
          if (r.status && r.status !== c.status) continue;
          lines.push(`      ${where}${r.label} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}]`);
        }
        for (const d of fr.details || []) lines.push(`      ${d}`);
        if (c.frames.length > 1 && !(fr.regions || []).length && !(fr.details || []).length) {
          lines.push(`      ${where}${fr.message}`);
        }
      }
    }
  }
  const s = report.summary;
  lines.push('', `${paint(report.status.toUpperCase(), COLOR[report.status])}: ${s.pass} passed, ${s.warn} warnings, ${s.fail} failed, ${s.skip} skipped`);
  return lines.join('\n') + '\n';
}
