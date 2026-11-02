// Target video formats. Square pixels, 8-bit.
export const FORMATS = {
  '1080p50': { width: 1920, height: 1080, fps: 50, interlaced: false },
  '1080i50': { width: 1920, height: 1080, fps: 25, interlaced: true },
  '2160p50': { width: 3840, height: 2160, fps: 50, interlaced: false },
};

export const DEFAULT_FORMAT = '1080p50';

export function getFormat(name = DEFAULT_FORMAT) {
  const f = FORMATS[name];
  if (!f) {
    throw new Error(`Unknown format "${name}". Use one of: ${Object.keys(FORMATS).join(', ')}`);
  }
  return { name, ...f };
}

// Safe areas as the fraction of the frame that is inside the area, centred.
// EBU R95 (2008): action safe 93%, graphics (title) safe 90%.
// SMPTE ST 2046-1: action safe 93%, graphics safe 90% for 16:9.
export const SAFE_AREAS = { action: 0.93, title: 0.9 };

export function safeRect(fmt, kind) {
  const k = SAFE_AREAS[kind];
  const w = fmt.width * k;
  const h = fmt.height * k;
  return { x: (fmt.width - w) / 2, y: (fmt.height - h) / 2, w, h };
}
