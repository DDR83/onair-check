# Issues to open after publishing

Each section is one issue: the heading is the title, the text below is the body.

## Frame-time jank check at 50 fps

Record `requestAnimationFrame` and long-task timings across the whole animation and flag frames over 20 ms (40 ms for 25 fps interlaced fields). Report the worst offenders and whether the animated CSS properties trigger layout or are compositor-only.

Done when: a fixture animating `left` fails and the same motion with `transform` passes.

## Playout contract conformance (CasparCG, SPX, OBS)

Drive the graphic through the CasparCG template protocol (add, play, update, next, stop, remove) and the SPX-GC play/stop/update hooks. Fail when `update(data)` throws, when `stop()` leaves content on screen, or when `remove` leaves residue. Add OBS/vMix browser-source expectations.

Done when: each protocol has a passing and a failing fixture.

## Long-text overflow fuzzing

Inject generated strings (very long surnames, strings without spaces, RTL, combining marks, CJK, emoji, empty, single character) into data fields or `update()` and re-run safe-area and overflow checks.

Done when: a fixed-width name box that clips or overflows is reported with the string that broke it.

## Alpha edge and premultiplied-alpha checks

Detect dark or light halos on semi-transparent edges caused by straight vs premultiplied alpha mismatch, and alpha that is not 0 in the "empty" state.

Done when: a fixture with a bad halo fails and a correct one passes.

## Config file and rule presets (EBU, ATSC, streaming)

Add `onair-check.config.json` with per-rule severity and thresholds, plus presets: `ebu` (R95/R103), `atsc`, `streaming` (full-range sRGB, no safe-area limits).

Done when: presets change results on the same fixture and the config is documented in the README.

## GitHub Action

Publish a composite action so `uses: DDR83/onair-check@v1` runs the checks, adds annotations for findings and uploads the HTML report as an artifact.

Done when: a sample workflow in the repo uses the action on a fixture and uploads the report.

## Playout target profiles (--target casparcg|spx|obs|vmix|browser)

Add a `--target` option that loads a profile adapting the checks to the playout system: supported Chromium/CEF features per target version, the control contract it calls, colour range and RGB to YUV conversion for legal levels, straight vs premultiplied alpha, default formats and frame rates, and offline network rules. Profiles are data files (versioned table per target) so new targets and versions need no code change. See ROADMAP.md, Playout conformance.
