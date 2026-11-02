import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = {
  win32: [
    ['PROGRAMFILES', 'Google/Chrome/Application/chrome.exe'],
    ['PROGRAMFILES(X86)', 'Google/Chrome/Application/chrome.exe'],
    ['LOCALAPPDATA', 'Google/Chrome/Application/chrome.exe'],
    ['PROGRAMFILES(X86)', 'Microsoft/Edge/Application/msedge.exe'],
    ['PROGRAMFILES', 'Microsoft/Edge/Application/msedge.exe'],
  ],
  darwin: [
    [null, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    [null, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
  ],
  linux: ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'].flatMap((n) =>
    ['/usr/bin', '/usr/local/bin', '/snap/bin', '/opt/google/chrome'].map((d) => [null, `${d}/${n}`]),
  ),
};

/** Find an installed Chrome/Chromium/Edge. Honours CHROME_PATH. Returns a path or null. */
export function findBrowser() {
  const env = process.env.CHROME_PATH;
  if (env) return fs.existsSync(env) ? env : null;
  for (const [base, rel] of CANDIDATES[process.platform] || []) {
    const p = base ? (process.env[base] ? path.join(process.env[base], rel) : null) : rel;
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}
