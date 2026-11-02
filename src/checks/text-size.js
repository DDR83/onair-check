// Check: minimum text size.
// Cap height is approximated as 0.7 x font-size (typical for sans-serif faces) and normalised to a
// 1080-line frame, so the same graphic is judged equally at 1080 and 2160.
// The limits are practical defaults for HD viewing, not taken from a standard.

export const id = 'text-size';
export const title = 'Minimum text size';
export const scope = 'frame';

export const CAP_RATIO = 0.7;
export const FAIL_BELOW = 12; // cap height px at 1080
export const WARN_BELOW = 18;

export function run({ format, frame }) {
  const scale = 1080 / format.height;
  const regions = [];
  let fails = 0, warns = 0, smallest = Infinity, checked = 0;
  for (const el of frame.elements) {
    if (!el.textRect || !(el.fontSize > 0)) continue;
    checked++;
    const cap = CAP_RATIO * el.fontSize * scale;
    smallest = Math.min(smallest, cap);
    if (cap < FAIL_BELOW) {
      fails++;
      regions.push({ ...el.textRect, label: `cap height ${cap.toFixed(1)}px: ${el.selector}`, status: 'fail' });
    } else if (cap < WARN_BELOW) {
      warns++;
      regions.push({ ...el.textRect, label: `cap height ${cap.toFixed(1)}px: ${el.selector}`, status: 'warn' });
    }
  }
  const metrics = { textElements: checked, smallestCapHeight1080: checked ? Math.round(smallest * 10) / 10 : null };
  if (!checked) return { status: 'pass', message: 'No text in this frame.', metrics, regions };
  if (fails) return { status: 'fail', message: `${fails} text element(s) below ${FAIL_BELOW}px cap height (at 1080).`, metrics, regions };
  if (warns) return { status: 'warn', message: `${warns} text element(s) below ${WARN_BELOW}px cap height (at 1080).`, metrics, regions };
  return { status: 'pass', message: `Smallest text has ${metrics.smallestCapHeight1080}px cap height (at 1080).`, metrics, regions };
}
