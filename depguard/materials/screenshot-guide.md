# Screenshot Guide — Replace Placeholders Before Publishing

Three placeholder mockups are provided in `materials/screenshot-*.png`. Replace them with real VS Code screenshots before submitting to the marketplace.

## How to Capture Real Screenshots

1. Install the extension locally (`vsce package` → drag `.vsix` into VS Code).
2. Open a sample Node.js project with known vulnerabilities (e.g., one with an outdated lodash).
3. Take screenshots of:
   - **screenshot-01**: DepGuard panel showing severity count badges (Critical / High / Medium / Low) and the vulnerability list.
   - **screenshot-02**: A single CVE entry expanded showing advisory URL, affected versions, and fix recommendation.
   - **screenshot-03**: The exported `depguard-report.html` file alongside the DepGuard panel.
4. Crop to 1280×800 (or 1920×1080) — VS Code marketplace accepts both.
5. Replace the placeholder files at:
   - `assets/screenshots/screenshot-01-scan-results.png`
   - `assets/screenshots/screenshot-02-cve-detail.png`
   - `assets/screenshots/screenshot-03-export-report.png`

## Screenshot Specifications

| Field | Value |
|---|---|
| Format | PNG |
| Dimensions | 1280 × 800 px (minimum) or 1920 × 1080 px |
| Content | VS Code UI with DepGuard panel visible |
| Watermark | Optional: bottom-right corner, subtle "DepGuard · lxstudio.dev" |
| Language | All text must be English (no CJK characters visible) |

> **Note**: Store description and README images must also be English-only.
