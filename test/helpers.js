import { fileURLToPath } from 'node:url';
import { openPage } from '../src/renderer.js';
import { getFormat } from '../src/formats.js';
import { findBrowser } from '../src/browser.js';

export const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
export const skip = findBrowser() ? false : 'no Chrome/Edge installed';

/** Render a fixture at one time and run a frame check on it. */
export async function runFrameCheck(check, name, { format = '1080p50', time = 0, ...extra } = {}) {
  const fmt = getFormat(format);
  const s = await openPage(fixture(name), { format: fmt });
  try {
    const frame = await s.capture(time);
    return check.run({ format: fmt, frame, ...extra });
  } finally {
    await s.close();
  }
}

/** Render a fixture and run a page-level check. */
export async function runPageCheck(check, name, { format = '1080p50', ...extra } = {}) {
  const fmt = getFormat(format);
  const s = await openPage(fixture(name), { format: fmt });
  try {
    await s.capture(0);
    return check.run({ format: fmt, requests: s.requests, ...extra });
  } finally {
    await s.close();
  }
}
