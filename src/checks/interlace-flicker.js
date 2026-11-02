// Check: interlace flicker risk.
// On interlaced formats each field carries every second line, so a 1px horizontal line or
// alternating fine horizontal detail shows in only one field and twitters at field rate.
// A pixel is a flicker candidate when its row differs strongly from BOTH the row above and
// below in the same direction (an isolated line, in luma or in alpha) while its horizontal
// neighbours match it (the line is horizontal). Runs of >= MIN_RUN candidates are reported.
// Skipped on progressive formats.

import { luma709 } from '../color.js';

export const id = 'interlace-flicker';
export const title = 'Interlace flicker risk';
export const scope = 'frame';

const STEP = 64; // minimum level difference (0-255) to the rows above and below
const MIN_RUN = 8; // minimum horizontal run in pixels
const FAIL_PIXELS = 500;
const MAX_REGIONS = 50;

export function run({ format, frame }) {
  if (!format.interlaced) {
    return { status: 'skip', message: `${format.name} is progressive: not applicable.` };
  }
  const { rgba, width, height } = frame;
  const n = width * height;
  const lum = new Float32Array(n);
  const alpha = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const a = rgba[i + 3];
    alpha[p] = a;
    lum[p] = (luma709(rgba[i], rgba[i + 1], rgba[i + 2]) * a) / 255;
  }
  const isLine = (v, p) => {
    const d1 = v[p] - v[p - width];
    const d2 = v[p] - v[p + width];
    return d1 * d2 > 0 && Math.abs(d1) >= STEP && Math.abs(d2) >= STEP && Math.abs(v[p] - v[p - 1]) < STEP / 2 && Math.abs(v[p] - v[p + 1]) < STEP / 2;
  };
  const regions = [];
  let flagged = 0;
  for (let y = 1; y < height - 1; y++) {
    let runStart = -1;
    for (let x = 1; x <= width - 1; x++) {
      const p = y * width + x;
      const hit = x < width - 1 && (isLine(lum, p) || isLine(alpha, p));
      if (hit && runStart < 0) runStart = x;
      if (!hit && runStart >= 0) {
        const len = x - runStart;
        if (len >= MIN_RUN) {
          flagged += len;
          if (regions.length < MAX_REGIONS) regions.push({ x: runStart, y, w: len, h: 1, label: '1px horizontal detail' });
        }
        runStart = -1;
      }
    }
  }
  const metrics = { flaggedPixels: flagged };
  if (flagged >= FAIL_PIXELS) {
    return { status: 'fail', message: `${flagged} px of 1px horizontal lines/detail will flicker on ${format.name}. Make lines at least 2px thick or soften them.`, metrics, regions };
  }
  if (flagged > 0) {
    return { status: 'warn', message: `${flagged} px of fine horizontal detail may twitter on ${format.name}.`, metrics, regions };
  }
  return { status: 'pass', message: 'No isolated 1px horizontal detail found.', metrics, regions };
}
