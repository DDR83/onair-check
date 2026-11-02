// Check: broadcast-legal levels.
// Code values are read as video levels (the usual pass-through of CG fill into a keyer):
// legal Rec.709 luma is 16-235 (of 255). EBU R103 allows overshoot of -5%..+105% of the 219-step
// range, so luma 5..246, and tolerates up to 1% of the picture area outside it.
// Only pixels that are clearly painted (alpha >= 128) count, so anti-aliased edges do not.

import { luma709 } from '../color.js';

export const id = 'legal-levels';
export const title = 'Legal levels (Rec.709 / EBU R103)';
export const scope = 'frame';

export const LEGAL = { min: 16, max: 235 };
export const R103 = { min: 5, max: 246 };
const AREA_LIMIT_PCT = 1;

export function run({ frame }) {
  const { rgba, width, height } = frame;
  const total = width * height;
  let painted = 0, strict = 0, tolerance = 0;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    if (rgba[i + 3] < 128) continue;
    painted++;
    const y = luma709(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (y >= LEGAL.min && y <= LEGAL.max) continue;
    strict++;
    if (y < R103.min || y > R103.max) tolerance++;
    const px = p % width;
    const py = (p / width) | 0;
    if (px < x0) x0 = px;
    if (px > x1) x1 = px;
    if (py < y0) y0 = py;
    if (py > y1) y1 = py;
  }
  const pct = (n) => Math.round((n / total) * 10000) / 100;
  const metrics = {
    paintedPct: pct(painted),
    outsideLegalPct: pct(strict),
    outsideR103TolerancePct: pct(tolerance),
  };
  const regions = strict ? [{ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, label: 'illegal-level pixels (bounding box)' }] : [];
  if (pct(tolerance) > AREA_LIMIT_PCT) {
    return {
      status: 'fail',
      message: `${metrics.outsideR103TolerancePct}% of the frame is beyond the R103 tolerance (luma <5 or >246); limit ${AREA_LIMIT_PCT}%.`,
      metrics,
      regions,
    };
  }
  if (pct(strict) > AREA_LIMIT_PCT) {
    return {
      status: 'warn',
      message: `${metrics.outsideLegalPct}% of the frame is outside luma 16-235 (within R103 tolerance); limit ${AREA_LIMIT_PCT}%.`,
      metrics,
      regions,
    };
  }
  return { status: 'pass', message: `${metrics.outsideLegalPct}% of the frame outside luma 16-235.`, metrics, regions };
}
