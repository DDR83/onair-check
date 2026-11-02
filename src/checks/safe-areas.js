// Check: visible elements stay inside the safe areas.
// EBU R95 and SMPTE ST 2046-1: action safe 93%, graphics (title) safe 90% of the frame, centred.
// Text outside title-safe fails. Other graphics outside action-safe warn. Elements that cover
// (nearly) the whole frame are treated as backgrounds and ignored.

import { safeRect } from '../formats.js';

export const id = 'safe-areas';
export const title = 'Safe areas (EBU R95 / SMPTE ST 2046-1)';
export const scope = 'frame';

const FULL_FRAME_RATIO = 0.95;
const EPS = 0.5;

function outside(r, safe) {
  return r.x < safe.x - EPS || r.y < safe.y - EPS || r.x + r.w > safe.x + safe.w + EPS || r.y + r.h > safe.y + safe.h + EPS;
}

export function run({ format, frame }) {
  const action = safeRect(format, 'action');
  const titleSafe = safeRect(format, 'title');
  const regions = [];
  let fails = 0;
  let warns = 0;
  for (const el of frame.elements) {
    const box = el.rect;
    if (box.w >= format.width * FULL_FRAME_RATIO && box.h >= format.height * FULL_FRAME_RATIO) continue;
    if (el.textRect && outside(el.textRect, titleSafe)) {
      fails++;
      regions.push({ ...el.textRect, label: `text outside title-safe: ${el.selector}`, status: 'fail' });
    } else if ((el.hasBg || el.isMedia) && outside(box, action)) {
      warns++;
      regions.push({ ...box, label: `outside action-safe: ${el.selector}`, status: 'warn' });
    }
  }
  const metrics = { textOutsideTitleSafe: fails, graphicsOutsideActionSafe: warns };
  const areas = { actionSafe: action, titleSafe };
  if (fails) return { status: 'fail', message: `${fails} text element(s) outside title-safe (90%).`, metrics, regions, areas };
  if (warns) return { status: 'warn', message: `${warns} graphic(s) outside action-safe (93%).`, metrics, regions, areas };
  return { status: 'pass', message: 'All visible elements inside the safe areas.', metrics, regions, areas };
}
