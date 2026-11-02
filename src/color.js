// Colour maths. Rec.709 luma coefficients and WCAG contrast.

/** Luma Y' (0-255) from 8-bit R'G'B' values, Rec.709 coefficients. */
export function luma709(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function lin(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0-1) from 8-bit sRGB. */
export function relativeLuminance(r, g, b) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1-21) between two [r,g,b] colours. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(...a);
  const lb = relativeLuminance(...b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite [r,g,b] with alpha (0-1) over a [r,g,b] backdrop. */
export function over(fg, alpha, bg) {
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
}

/** Parse "rgb(...)" / "rgba(...)" from getComputedStyle. Returns {rgb, a}. */
export function parseCssColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return { rgb: [0, 0, 0], a: 0 };
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
}
