// Check: contrast of text against what is rendered behind it.
// The renderer captures the frame a second time with all text made transparent; the mean colour of
// that capture under the text box is the backdrop. Contrast is the WCAG ratio. Where the backdrop
// is mostly transparent the graphic is keyed over live video and contrast cannot be judged here.
// Limits: fail below 3:1, warn below 4.5:1 (WCAG AA for large / normal text).

import { contrastRatio, over, parseCssColor } from '../color.js';

export const id = 'text-contrast';
export const title = 'Text contrast';
export const scope = 'frame';

export const FAIL_BELOW = 3;
export const WARN_BELOW = 4.5;

function backdrop(frame, r) {
  const x0 = Math.max(0, Math.floor(r.x)), x1 = Math.min(frame.width, Math.ceil(r.x + r.w));
  const y0 = Math.max(0, Math.floor(r.y)), y1 = Math.min(frame.height, Math.ceil(r.y + r.h));
  let n = 0, solid = 0, sr = 0, sg = 0, sb = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * frame.width + x) * 4;
      n++;
      if (frame.rgbaNoText[i + 3] < 128) continue;
      solid++;
      sr += frame.rgbaNoText[i];
      sg += frame.rgbaNoText[i + 1];
      sb += frame.rgbaNoText[i + 2];
    }
  }
  if (!n || solid / n < 0.5) return null;
  return [sr / solid, sg / solid, sb / solid];
}

export function run({ frame }) {
  const regions = [];
  let fails = 0, warns = 0, judged = 0, overVideo = 0, worst = Infinity;
  for (const el of frame.elements) {
    if (!el.textRect) continue;
    const bg = backdrop(frame, el.textRect);
    if (!bg) {
      overVideo++;
      continue;
    }
    const c = parseCssColor(el.color);
    const fg = over(c.rgb, c.a * el.opacity, bg);
    const ratio = contrastRatio(fg, bg);
    judged++;
    worst = Math.min(worst, ratio);
    const label = `contrast ${ratio.toFixed(2)}:1: ${el.selector}`;
    if (ratio < FAIL_BELOW) {
      fails++;
      regions.push({ ...el.textRect, label, status: 'fail' });
    } else if (ratio < WARN_BELOW) {
      warns++;
      regions.push({ ...el.textRect, label, status: 'warn' });
    }
  }
  const metrics = { judged, overTransparent: overVideo, worstRatio: judged ? Math.round(worst * 100) / 100 : null };
  if (fails) return { status: 'fail', message: `${fails} text element(s) below ${FAIL_BELOW}:1 contrast (worst ${metrics.worstRatio}:1).`, metrics, regions };
  if (warns) return { status: 'warn', message: `${warns} text element(s) below ${WARN_BELOW}:1 contrast (worst ${metrics.worstRatio}:1).`, metrics, regions };
  if (!judged) {
    return {
      status: 'pass',
      message: overVideo ? `${overVideo} text element(s) sit on a transparent area (keyed over video): not judged.` : 'No text in this frame.',
      metrics,
      regions,
    };
  }
  return { status: 'pass', message: `Worst text contrast ${metrics.worstRatio}:1.`, metrics, regions };
}
