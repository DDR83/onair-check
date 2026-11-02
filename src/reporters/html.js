import { safeRect } from '../formats.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const STROKE = { pass: '#2ecc71', warn: '#f5a623', fail: '#ff4d4f', skip: '#8a8f98' };

const CSS = `
:root{color-scheme:dark;--bg:#14161a;--panel:#1d2026;--text:#e8eaed;--muted:#9aa0a6;--pass:#2ecc71;--warn:#f5a623;--fail:#ff4d4f;--skip:#8a8f98}
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 8px}
.meta{color:var(--muted);margin:0 0 16px;word-break:break-all}
.badge{display:inline-block;padding:1px 9px;border-radius:10px;font-size:12px;font-weight:700;color:#111;text-transform:uppercase}
.b-pass{background:var(--pass)}.b-warn{background:var(--warn)}.b-fail{background:var(--fail)}.b-skip{background:var(--skip)}
table{width:100%;border-collapse:collapse;background:var(--panel);border-radius:8px;overflow:hidden}
td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #2a2e36;vertical-align:top}th{color:var(--muted);font-weight:600;font-size:13px}
code{font-family:ui-monospace,Consolas,monospace;font-size:13px}
figure{margin:0 0 20px;background:var(--panel);padding:12px;border-radius:8px}figcaption{color:var(--muted);margin-bottom:8px;font-size:13px}
.frame{position:relative;width:100%;aspect-ratio:var(--ar);background:conic-gradient(#3a3d44 25%,#2b2e34 0 50%,#3a3d44 0 75%,#2b2e34 0) 0 0/24px 24px}
.frame img,.frame svg{position:absolute;inset:0;width:100%;height:100%}
ul.regions{margin:8px 0 0;padding-left:18px;color:var(--muted);font-size:13px}
@media(max-width:600px){td,th{padding:6px 8px}}
`;

function frameFigure(report, img) {
  const { width, height } = report.format;
  const shapes = [];
  const safe = (kind, color) => {
    const r = safeRect(report.format, kind);
    shapes.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="14 10" opacity=".7"/>`);
  };
  safe('action', '#4aa3ff');
  safe('title', '#b07cff');
  const notes = [];
  for (const c of report.checks) {
    for (const fr of c.frames) {
      if (fr.time !== img.time) continue;
      for (const r of fr.regions || []) {
        const st = r.status || fr.status;
        if (st !== 'warn' && st !== 'fail') continue;
        const w = Math.max(r.w, 4), h = Math.max(r.h, 4);
        shapes.push(`<rect x="${r.x}" y="${r.y}" width="${w}" height="${h}" fill="${STROKE[st]}" fill-opacity=".12" stroke="${STROKE[st]}" stroke-width="3"/>`);
        notes.push(`<li><span class="badge b-${st}">${st}</span> <code>${esc(c.id)}</code> ${esc(r.label)}</li>`);
      }
    }
  }
  const b64 = img.png.toString('base64');
  return `<figure><figcaption>Frame at ${esc(img.time)} ms. Dashed blue: action-safe 93%. Dashed purple: title-safe 90%.</figcaption>
<div class="frame" style="--ar:${width}/${height}"><img alt="Frame at ${esc(img.time)} ms" src="data:image/png;base64,${b64}"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${shapes.join('')}</svg></div>
${notes.length ? `<ul class="regions">${notes.join('')}</ul>` : ''}</figure>`;
}

/** Self-contained HTML report (images embedded). */
export function renderHtml(report) {
  const f = report.format;
  const rows = report.checks
    .map(
      (c) => `<tr><td><span class="badge b-${c.status}">${c.status}</span></td><td><code>${esc(c.id)}</code><br><span style="color:var(--muted);font-size:13px">${esc(c.title)}</span></td><td>${esc(c.message)}${(c.frames.flatMap((fr) => fr.details || []).slice(0, 5).map((d) => `<br><code>${esc(d)}</code>`)).join('')}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>onair-check report</title><style>${CSS}</style></head><body><main>
<h1>onair-check report <span class="badge b-${report.status}">${report.status}</span></h1>
<p class="meta">${esc(report.target)}<br>${esc(f.name)} ${f.width}x${f.height}${f.interlaced ? ' interlaced' : ''}, frames at ${esc(report.times.join(', '))} ms, onair-check ${esc(report.version)}<br>
${report.summary.pass} passed, ${report.summary.warn} warnings, ${report.summary.fail} failed, ${report.summary.skip} skipped</p>
<table><thead><tr><th>Result</th><th>Check</th><th>Finding</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Frames</h2>
${report.images.map((img) => frameFigure(report, img)).join('\n')}
</main></body></html>
`;
}
