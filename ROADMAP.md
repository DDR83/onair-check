# Roadmap

The MVP (v0.1) covers six checks, three reporters and a CLI. Everything below is planned, not built.

## Rendering and performance
- **Frame-time jank at 50 fps.** Record `requestAnimationFrame` and long-task timings for the whole animation, flag frames over 20 ms (40 ms for 25 fps interlaced fields), report the worst offenders and the CSS properties animating (layout vs compositor-only).
- **Memory and GPU budget.** Sample JS heap, decoded image bytes and layer count via CDP (`Performance.getMetrics`, `LayerTree`), fail above a configurable budget so a template does not starve the playout machine.

## Playout conformance
- **Playout contract.** Drive the graphic through the CasparCG template protocol (`add`, `play`, `update`, `next`, `stop`, `remove`), the SPX-GC `play`/`stop`/`update` hooks and OBS/vMix browser-source expectations. Fail when `update(data)` throws, when `stop()` never leaves the frame empty, or when the graphic leaves residue after `remove`.
- **Alpha edge and premultiplied checks.** Detect fringing from straight-vs-premultiplied alpha mismatch, dark/light halos on semi-transparent edges, and alpha that is not 0 in the "empty" state.

## Content robustness
- **Long-text overflow fuzzing.** Inject generated strings (very long surnames, no-space strings, RTL, combining marks, CJK, emoji, 0 and 1 character) into `[data-*]`/`update()` fields, then re-run safe-area and overflow checks.
- **Colour-blind simulation.** Render protan/deutan/tritan simulations and check that information-carrying colour pairs (e.g. red/green delta) keep sufficient contrast.

## Tooling
- **Config file and rule presets.** `onair-check.config.json` with per-rule severity and thresholds, plus presets: `ebu` (R95/R103), `atsc`, `streaming` (full-range sRGB, no safe-area limits).
- **GitHub Action.** `uses: .../onair-check@v1` with annotations and the HTML report as an artifact.
- **VS Code integration.** Run on save, show findings as diagnostics, preview frames in a webview.
- **Watch mode.** Re-render on file change and keep a live report open.

## Quality
- More fixtures per check, a golden-image test set, Windows/macOS CI.
