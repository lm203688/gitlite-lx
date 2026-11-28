# Changelog

## 1.0.1 — 2026-11-28

- Pro checkout now opens by default: `gitlite.buyoutLink` defaults to the reusable Paddle payment link ($9 one-time). No manual setup needed.

## 1.0.0 — 2026-11-17

Initial release.

- Inline blame decorations (colored left-border + overview ruler dots per author commit range)
- File History sidebar (recent 50 commits for the active file, clickable)
- Diff Viewer webview (compare any two commits, or HEAD vs working tree)
- Multi-language syntax awareness (TS/JS/Python/Go/Rust/JSON/YAML/TOML/Bash...)
- Pro upgrade path: $9 one-time buyout via Paddle. Pro features (Phase 2 - Upcoming): commit graph, batch export, multi-repo management, commit message templates. Phase 1 is fully free. GitLite Pro and CodeShot Pro share one license.
- Zero remote data — all git commands run locally via Node child_process
- License verification via shared Cloudflare Worker (/verify endpoint)
