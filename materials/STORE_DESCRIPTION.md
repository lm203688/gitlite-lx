# GitLite — Inline Blame & File History

Lightweight GitLens alternative for VS Code. See who changed each line, track file history, and view diffs — all locally, no bloat.

## Why GitLite?

GitLens is powerful but heavy (50MB+, requires GitKraken account). GitLite gives you the **core features** you actually use: inline blame annotations, a clean file-history sidebar, and an integrated diff viewer — in under 10MB, with zero external dependencies.

Your code never leaves your machine. All git commands run via `child_process` on your local filesystem. The only network call is license verification when you activate Pro.

## Features

### Free (no account required)
- **Inline Blame** — colored left-border strips per author-commit range + overview-ruler dots, so you can instantly see who last touched each line
- **File History Sidebar** — recent 50 commits for the active file, displayed as a clickable tree; click any commit to open a diff
- **Diff Viewer** — webview-based side-by-side diff between any two commits (or working tree vs HEAD); color-coded added/removed lines
- **Multi-language support** — TypeScript, JavaScript, Python, Go, Rust, JSON, YAML, TOML, Bash, Shell, SQL, Markdown, and more

### Pro — $9 one-time buyout [Phase 2 - Upcoming]
> Note: Phase 1 (current release) is fully free. Pro features unlock Phase 2 upgrades; the license system is in place but the features below ship in a future update.

- **Commit Graph Visualization** [Phase 2 - Upcoming] — visual timeline of branches and merges inline with blame
- **Batch Diff Export** [Phase 2 - Upcoming] — export diffs for multiple files at once (PNG/SVG)
- **Multi-Repo Management** [Phase 2 - Upcoming] — switch between repositories from the sidebar without reopening files
- **Commit Message Template Assistant** [Phase 2 - Upcoming] — predefined templates (feat/fix/chore) with Conventional Commits support

**Shared license**: GitLite Pro and CodeShot Pro share one license pool (buying either unlocks both within their respective extensions).

## Installation

1. Open VS Code Extensions panel (`Ctrl+Shift+X`)
2. Search for **"GitLite"** by LxStudio
3. Click **Install**
4. Open any file inside a git repository
5. Right-click → **GitLite: Toggle Inline Blame** to see per-line attribution

## Configuration

Open VS Code Settings (`Ctrl+,`) and search for "gitlite":

| Setting | Default | Description |
|---|---|---|
| `gitlite.verifyEndpoint` | `https://snapmark-license.463102527.workers.dev/verify` | License verification endpoint (Cloudflare Worker) |
| `gitlite.buyoutLink` | *(empty)* | Paddle checkout URL for Pro ($9). Set after creating your product in Paddle. |

## Privacy

- Zero ads, zero telemetry, zero analytics
- All git operations run locally (`git log`, `git blame`, `git diff`)
- No source code or file contents are transmitted
- Only network call: HTTPS POST with `{license: "vs-..."}` during Pro activation
- Full privacy policy: see [privacy-policy.html](privacy-policy.html) included with the extension

## FAQ

**Q: Do I need GitLens installed?**
No. GitLite is fully independent. You can uninstall GitLens if desired.

**Q: Does this work with large repositories?**
Yes. Git commands run natively and we cap output at 50 recent commits per file. No memory issues.

**Q: What VS Code version is required?**
VS Code 1.80.0 or later.

**Q: Can I customize blame colors?**
Not in Phase 1. Custom themes are a Pro feature coming soon.

**Q: How do I activate Pro?**
Purchase at the Paddle checkout link (configure `gitlite.buyoutLink` in settings), then paste the license key via **GitLite: Activate Pro** command.

## Support

Questions or feedback? Email us at **support@lxstudio.app**.
