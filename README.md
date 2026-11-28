# GitLite — Inline Blame & File History

Lightweight GitLens alternative. Inline blame, file history timeline, and simple diff viewer — fast, local, no bloat. Your code never leaves your machine.

---

## Features

### Free
- **Inline Blame** — colored left-border strips per author commit range, with overview-ruler dots
- **File History Sidebar** — recent 50 commits for the current file, clickable to open diffs
- **Diff Viewer** — webview-based side-by-side diff between any two commits (or working tree)
- **Multi-language support** — TypeScript, JavaScript, Python, Go, Rust, JSON, YAML, TOML, Bash, and more

### Pro ($9 one-time) [Phase 2 - Upcoming]
> Phase 1 (current release) is fully free. The license system is in place; Pro features below ship in a future update. GitLite Pro and CodeShot Pro share one license.

- Full-color commit graph visualization (inline) [Phase 2 - Upcoming]
- Batch export diffs (multiple files at once) [Phase 2 - Upcoming]
- Multi-repo parallel management [Phase 2 - Upcoming]
- Commit message template helper [Phase 2 - Upcoming]
- Custom color themes for blame strips [coming soon]

---

## Getting Started

1. Open a file inside a git repository
2. Right-click → **GitLite: Toggle Inline Blame** to see author attribution per line
3. Right-click → **GitLite: Show File History** to open the history sidebar
4. Right-click → **GitLite: Diff with Previous Version** to compare with the prior commit

---

## Activation

Purchase Pro via our secure Paddle checkout — the payment link opens automatically. After purchase:

1. Right-click → **GitLite: Upgrade to Pro** (opens checkout in browser)
2. Or paste your license key via **GitLite: Activate Pro** command (found in Command Palette `Ctrl+Shift+P`)

Your code never leaves your machine. The only network call is the license `/verify` request.

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `gitlite.verifyEndpoint` | `https://snapmark-license.463102527.workers.dev/verify` | License service URL |
| `gitlite.buyoutLink` | *(defaults to reusable payment link)* | Paddle checkout URL for Pro ($9 buyout). |

---

## Privacy

- All git commands (`git log`, `git blame`, `git diff`) run **locally** on your machine
- **Zero** external data collection
- Zero ads, zero telemetry
- Only network call: HTTPS POST to the license worker when activating Pro (body = `{license: "vs-..."}`)

---

## FAQ

**Q: Does this require GitLens?**  
A: No. GitLite is fully independent. Uninstall GitLens if you want.

**Q: Is my code uploaded anywhere?**  
A: No. All git operations run via `child_process.execSync` on your local machine.

**Q: Can I customize the blame colors?**  
A: Currently no (Phase 1). Pro includes custom theme support.

**Q: What VS Code version is required?**  
A: VS Code 1.80.0+ (for stable WebviewPanel API).

---

## License

MIT — see [LICENSE.md](LICENSE.md)
