# Screenshot Guide — Replace Placeholders Before Publishing

Three placeholder mockups are provided in `materials/screenshot-*.png`. Replace them with real VS Code screenshots before submitting to the marketplace.

## How to Capture Real Screenshots

1. Install the extension locally (`vsce package` → drag `.vsix` into VS Code).
2. Open a sample project folder.
3. Take screenshots of:
   - **screenshot-01**: FlowTasks panel with at least 3 task groups visible in the tree view.
   - **screenshot-02**: A single group expanded showing its step definitions.
   - **screenshot-03**: Terminal output after running a group successfully.
4. Crop to 1280×800 (or 1920×1080) — VS Code marketplace accepts both.
5. Replace the placeholder files at:
   - `assets/screenshots/screenshot-01-task-list.png`
   - `assets/screenshots/screenshot-02-group-view.png`
   - `assets/screenshots/screenshot-03-execution-result.png`

## Screenshot Specifications

| Field | Value |
|---|---|
| Format | PNG |
| Dimensions | 1280 × 800 px (minimum) or 1920 × 1080 px |
| Content | VS Code UI with FlowTasks panel visible |
| Watermark | Optional: bottom-right corner, subtle "FlowTasks · lxstudio.dev" |
| Language | All text must be English (no CJK characters visible) |

> **Note**: Store description and README images must also be English-only.
