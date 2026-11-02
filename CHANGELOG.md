# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- CLI `onair-check <url|file>` with `--format`, `--at`, `--json`, `--html`, `--strict`, `--opaque`.
- Headless renderer (playwright-core with an installed Chrome/Edge): transparent capture, animation stepping via the Web Animations API, external requests blocked and recorded.
- Checks: safe-areas, legal-levels, interlace-flicker, text-size, text-contrast, network, transparency.
- Reporters: console, JSON, self-contained HTML with annotated frames.
- Project skeleton, CI workflow, documentation.
