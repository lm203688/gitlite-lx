# SnippetVault — Changelog

## 1.0.2 (2026-11-19)

- Docs: marketplace listing now shows three real screenshots (tree view,
  search, insert-at-cursor) instead of placeholder images.

## 1.0.1 (2026-11-19)

- Fixed: the snippet tree view was empty after first launch. Snippets are now
  loaded with a retry guard so the tree always shows all grouped snippets.
- Fixed: snippets are kept in a module-scope store instead of `ExtensionContext`,
  which VS Code does not reliably persist arbitrary properties on.
- Removed: backup/debug artifacts from the packaged extension.

## 1.0.0 (2026-11-18)

- Initial release.
- Local GUI tree view for VS Code snippets.
- Real-time search across prefix, description, and body content.
- Inline preview and edit panel per snippet.
- One-click insert into active editor (Ctrl+Space).
- ZIP export with README metadata (Free ≤ 100 snippets).
- Pro ($7 one-time): unlimited snippets, ZIP import, advanced fuzzy/regex search, tag system (Phase 2).
- Zero network calls except license verification at activation time.
- All processing runs locally — no code or snippets leave your machine.
