import fs from 'node:fs';
import { runChecks, exitCode } from './run.js';
import { renderConsole } from './reporters/console.js';
import { renderJson } from './reporters/json.js';
import { FORMATS } from './formats.js';

const USAGE = `Usage: onair-check <url|file> [options]

Options:
  --format <name>   ${Object.keys(FORMATS).join(' | ')} (default 1080p50)
  --at <times>      comma separated ms or "end" (default 0,end)
  --json            print the report as JSON
  --html <file>     also write an HTML report with annotated frames
  --strict          exit 1 on warnings too
  --opaque          the graphic is expected to have an opaque background
  -h, --help        show this help

Exit codes: 0 pass or warnings, 1 failures, 2 usage or runtime error.
Set CHROME_PATH to use a specific Chrome or Edge.
`;

export function parseArgs(argv) {
  const opts = { format: '1080p50', at: '0,end', json: false, strict: false, expectTransparent: true, html: null, target: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '--format') opts.format = val();
    else if (a === '--at') opts.at = val();
    else if (a === '--json') opts.json = true;
    else if (a === '--html') opts.html = val();
    else if (a === '--strict') opts.strict = true;
    else if (a === '--opaque') opts.expectTransparent = false;
    else if (a.startsWith('-')) throw new Error(`Unknown option ${a}`);
    else if (opts.target) throw new Error('Only one target is accepted');
    else opts.target = a;
  }
  return opts;
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
    if (opts.help || !opts.target) {
      (opts.help ? stdout : stderr).write(USAGE);
      return opts.help ? 0 : 2;
    }
    const report = await runChecks(opts.target, opts);
    if (opts.html) {
      const { renderHtml } = await import('./reporters/html.js');
      fs.writeFileSync(opts.html, renderHtml(report));
    }
    stdout.write(opts.json ? renderJson(report) : renderConsole(report, { color: Boolean(stdout.isTTY) }));
    return exitCode(report, opts);
  } catch (err) {
    stderr.write(`onair-check: ${err.message}\n`);
    return 2;
  }
}
