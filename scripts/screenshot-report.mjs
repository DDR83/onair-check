// Usage: node scripts/screenshot-report.mjs <report.html> <out.png>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { findBrowser } from '../src/browser.js';

const [html, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: findBrowser() });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto(pathToFileURL(path.resolve(html)).href);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
