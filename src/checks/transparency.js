// Check: the background of the graphic is really transparent.
// A keyed overlay with an opaque html/body background blocks the programme video.

export const id = 'transparency';
export const title = 'Background transparency';
export const scope = 'frame';

const WARN_BELOW_PCT = 5;

export function run({ frame, expectTransparent = true }) {
  if (!expectTransparent) {
    return { status: 'skip', message: 'Opaque background expected (--opaque).' };
  }
  const { rgba, width, height } = frame;
  const total = width * height;
  let clear = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) clear++;
  const pct = (clear / total) * 100;
  const metrics = { transparentPct: round(pct) };
  if (clear === 0) {
    return {
      status: 'fail',
      message: 'No transparent pixels: the page paints an opaque background (check html/body background and full-frame elements).',
      metrics,
    };
  }
  if (clear === total) {
    return {
      status: 'warn',
      message:
        'The frame is completely empty: nothing is on screen at this time, so the other checks pass without testing anything. Pick a time when the graphic is visible, or expose window.onairSeek(ms).',
      metrics,
    };
  }
  if (pct < WARN_BELOW_PCT) {
    return {
      status: 'warn',
      message: `Only ${metrics.transparentPct}% of the frame is transparent: the graphic covers almost everything.`,
      metrics,
    };
  }
  return { status: 'pass', message: `${metrics.transparentPct}% of the frame is transparent.`, metrics };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
