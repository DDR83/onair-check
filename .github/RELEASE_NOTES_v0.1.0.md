# onair-check v0.1.0

First public release: an on-air QA linter for HTML broadcast graphics (CasparCG, OBS, vMix browser sources).

## What is in it
- CLI: `onair-check <url|file> [--format 1080p50|1080i50|2160p50] [--at 0,500,end] [--json] [--html file] [--strict] [--opaque]`
- Headless render at the target resolution with a transparent background; animations are stepped through the Web Animations API, other pages use real time.
- Seven checks, each reporting pass / warn / fail per captured time:
  - `safe-areas` (EBU R95, SMPTE ST 2046-1)
  - `legal-levels` (Rec.709 range, EBU R103 tolerance)
  - `interlace-flicker`
  - `text-size`
  - `text-contrast`
  - `network` (external requests that fail offline)
  - `transparency`
- Reporters: console, JSON, self-contained HTML with annotated frames.
- Exit codes for CI: 0 pass or warnings, 1 failures, 2 usage or runtime error.

## Requirements
Node.js 18+ and an installed Chrome or Edge (or set `CHROME_PATH`). One dependency: `playwright-core`, no browser download.

## Known limits
Heuristic checks, not certification. Text size and contrast limits are practical defaults. See ROADMAP.md for what is planned.
