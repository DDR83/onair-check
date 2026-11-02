import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { findBrowser } from './browser.js';
import { decodePng } from './png.js';

const MAX_END_MS = 60000;

export function toUrl(target) {
  if (/^(https?|file):/i.test(target)) return target;
  return pathToFileURL(path.resolve(target)).href;
}

export function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
}

// Runs in the page: list painted elements with geometry and computed style.
function snapshotElements() {
  const out = [];
  const media = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO']);
  const label = (el) =>
    el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].join('.') : '');
  for (const el of document.body ? document.body.querySelectorAll('*') : []) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    let op = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    if (op <= 0.01) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const textNodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    const text = textNodes.map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(cs.backgroundColor);
    const bgAlpha = m ? Number(m[1]) : cs.backgroundColor === 'transparent' ? 0 : 1;
    const hasBg =
      bgAlpha > 0 || cs.backgroundImage !== 'none' || (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none');
    const isMedia = media.has(el.tagName.toUpperCase());
    if (!text && !hasBg && !isMedia) continue;
    let textRect = null;
    if (text) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const n of textNodes) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const q of range.getClientRects()) {
          if (q.width <= 0 || q.height <= 0) continue;
          x0 = Math.min(x0, q.left);
          y0 = Math.min(y0, q.top);
          x1 = Math.max(x1, q.right);
          y1 = Math.max(y1, q.bottom);
        }
      }
      if (x1 > x0) textRect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    out.push({
      selector: label(el),
      tag: el.tagName.toLowerCase(),
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      text: text.slice(0, 60),
      textRect,
      color: cs.color,
      fontSize: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily,
      hasBg,
      isMedia,
      opacity: op,
    });
  }
  return out;
}

function stepAnimations(t) {
  const anims = document.getAnimations();
  for (const a of anims) {
    a.pause();
    a.currentTime = t;
  }
  return anims.length;
}

function animationsEnd() {
  let end = 0;
  for (const a of document.getAnimations()) {
    const e = a.effect && a.effect.getComputedTiming().endTime;
    if (Number.isFinite(e)) end = Math.max(end, e);
  }
  return end;
}

const HIDE_TEXT_CSS =
  '*,*::before,*::after{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important;caret-color:transparent!important}';

/**
 * Open a page at the format's size with a transparent background.
 * External (non-local) requests are recorded and aborted, like an offline playout machine.
 */
export async function openPage(target, { format, browserPath } = {}) {
  const executablePath = browserPath || findBrowser();
  if (!executablePath) {
    throw new Error('No Chrome/Edge found. Install one or set CHROME_PATH to its executable.');
  }
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const context = await browser.newContext({
    viewport: { width: format.width, height: format.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const url = toUrl(target);
  const requests = [];
  await page.route('**/*', (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const web = ['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol);
    const external = web && !isLocalHost(u.hostname) && req.url() !== url;
    if (web) requests.push({ url: req.url(), type: req.resourceType(), external });
    return external ? route.abort('internetdisconnected') : route.continue();
  });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const loadedAt = Date.now();
  let usesAnimations = null;

  async function capture(t) {
    const n = await page.evaluate(stepAnimations, t).catch(() => 0);
    usesAnimations = n > 0;
    if (!usesAnimations) {
      const wait = t - (Date.now() - loadedAt);
      if (wait > 0) await page.waitForTimeout(wait);
    }
    const shot = await page.screenshot({ omitBackground: true, type: 'png' });
    const handle = await page.addStyleTag({ content: HIDE_TEXT_CSS });
    const noText = await page.screenshot({ omitBackground: true, type: 'png' });
    await handle.evaluate((el) => el.remove());
    const elements = await page.evaluate(snapshotElements);
    const img = decodePng(shot);
    const imgNoText = decodePng(noText);
    return {
      time: t,
      width: img.width,
      height: img.height,
      rgba: img.data,
      rgbaNoText: imgNoText.data,
      png: shot,
      elements,
    };
  }

  return {
    url,
    requests,
    capture,
    endTime: async () => Math.min(MAX_END_MS, await page.evaluate(animationsEnd)),
    usesAnimations: () => usesAnimations,
    close: () => browser.close(),
  };
}
