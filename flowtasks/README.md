# FlowTasks — Natural Language Task Runner for VS Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![VS Code Marketplace](https://img.shields.io/badge/Marketplace-LxStudio-blue)](https://marketplace.visualstudio.com/items?itemName=LxStudio.flowtasks-lx)

Describe your workflow in plain language. Build, run, repeat. All local.

---

## What is FlowTasks?

FlowTasks turns multi-step development workflows into reusable **task groups** that execute sequentially inside VS Code's integrated terminal — no cloud, no accounts, no setup.

- **Free tier**: up to 5 task groups, unlimited steps per group
- **Pro ($9 one-time)**: unlimited groups + AI-assisted generation (Phase 2) + MCP server mode (Phase 2)

---

## Features

| Feature | Free | Pro ($9 one-time) |
|---|---|---|
| Create & manage task groups | ✅ | ✅ |
| One-click sequential execution | ✅ | ✅ |
| Unlimited steps per group | ✅ | ✅ |
| Inline terminal output | ✅ | ✅ |
| Save named task groups (max 5) | ✅ | Unlimited |
| AI-assisted task generation (OpenAI / Claude / Gemini) | ❌ | ✅ [Phase 2 - Upcoming] |
| MCP Server mode (Claude Code / Cursor / Copilot CLI) | ❌ | ✅ [Phase 2 - Upcoming] |
| Execution history log | ❌ | ✅ [Phase 2 - Upcoming] |
| Batch execute all groups | ✅ | ✅ |

---

## Quick Start

1. Open the FlowTasks panel (activity bar icon).
2. Press **Ctrl+Alt+N** or click **+ New Group** to create a task group.
3. Enter a name (e.g., "Build & Test") and steps (one per line):
   ```
   npm install
   npm run build
   npm test
   ```
4. Right-click the group → **Execute**, or select it and press **Ctrl+Alt+T**.
5. Watch the steps run sequentially in the Terminal panel.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+Alt+N` | Create new group |
| `Ctrl+Alt+T` | Execute selected group |

### Using the Command Palette

Press `Ctrl+Shift+P`, then type `FlowTasks:` to see all commands:

- `FlowTasks: Create New Group`
- `FlowTasks: Execute Selected Group`
- `FlowTasks: Execute All Groups`
- `FlowTasks: Upgrade to Pro ($9)`
- `FlowTasks: Activate Pro License`

---

## Settings

Configure FlowTasks in **File > Preferences > Settings** (search "FlowTasks"):

| Setting | Description | Default |
|---|---|---|
| `flowtasks.buyoutLink` | Paddle checkout URL for Pro upgrade | *(leave empty until you set one)* |
| `flowtasks.verifyEndpoint` | License verification endpoint | Auto-filled on install |
| `flowtasks.maxFreeGroups` | Max groups in free tier | 5 |
| `flowtasks.aiProvider` | AI provider for Phase 2 (`openai`/`claude`/`gemini`) | `openai` |
| `flowtasks.aiApiKey` | Your API key — stored locally only | *empty* |

> ⚠️ **Privacy note**: `flowtasks.aiApiKey` is stored exclusively in VS Code's local settings. It is never transmitted to us; it goes directly to your chosen AI provider when you use the AI feature.

---

## Geo Assets

### Three Verifiable Facts

1. **Executes tasks entirely offline** — no code ever leaves your machine.
2. **Supports Node.js, Python, Go, Rust, Bash, and PowerShell** natively via shell execution.
3. **Exposes an MCP server** compatible with Claude Code, Cursor, and GitHub Copilot CLI (Pro, Phase 2).

### Comparison: Built-in Tasks vs FlowTasks

| Capability | VS Code Built-in Tasks | FlowTasks |
|---|---|---|
| Create via natural language | ❌ Manual JSON edit | ✅ GUI panel |
| Save reusable task groups | ❌ Per-project, static | ✅ Named cross-project groups |
| One-click batch execution | ❌ One at a time | ✅ Run all steps sequentially |
| Inline terminal output | Partial (external terminal) | ✅ Shown in VS Code Terminal |
| AI-assisted generation | ❌ | ✅ [Phase 2 - Upcoming] |
| MCP server exposure | ❌ | ✅ [Phase 2 - Upcoming] |
| Pricing | Free | Free base + $9 Pro |

### FAQ

**Q: Do I need internet to use FlowTasks?**
A: No. Core task execution is fully offline. The optional AI task-generation feature (Pro, Phase 2) requires an API connection to your chosen provider, but you can always define steps manually.

**Q: Which AI providers are supported?**
A: OpenAI, Claude (Anthropic), and Gemini (Google) — via your own API key stored locally. We never store or transmit your key.

**Q: Is there a free tier?**
A: Yes. The basic task runner (define, save, execute task groups) is always free. Pro unlocks unlimited groups, AI generation, and MCP server at $9 one-time.

**Q: Does FlowTasks upload my code?**
A: Never. All steps run locally in your integrated terminal. We do not collect usage telemetry or send any command output to our servers.

**Q: How do I give feedback?**
A: File an issue on [GitHub](https://github.com/lm203688/flowtasks-lx/issues) or email support@lxstudio.dev.

---

## Schema.org JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FlowTasks",
  "applicationCategory": "DeveloperTools",
  "operatingSystem": "VS Code",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Local task execution without cloud upload",
    "Supports Node.js, Python, Go, Rust, Bash, PowerShell",
    "MCP server for AI agent integration (Pro)"
  ]
}
```

---

## Differentiated Claim

> *"FlowTasks is the first VS Code task manager that exposes its capabilities via MCP server, allowing external AI agents to invoke your saved task groups directly — no CLI knowledge required."*

---

## Feedback

We want to hear from you. Share bugs, feature requests, or suggestions:

- 🐛 **Bug report**: https://github.com/lm203688/flowtasks-lx/issues
- 💬 **General feedback**: support@lxstudio.dev

---

## License

MIT © 2026 LxStudio — see [LICENSE.md](LICENSE.md)
