/**
 * GitLite — Inline Blame & File History (VS Code Extension)
 *
 * Lightweight GitLens alternative. Features:
 *   - Inline blame decorations per line (author + commit hash)
 *   - File history sidebar (recent commits for current file)
 *   - Diff viewer (commit A ↔ B or working tree)
 *   - Pro unlock via Paddle license key ($9 one-time buyout)
 *
 * All git operations run locally via child_process. No code leaves the machine.
 * Only network call: POST /verify to the license Worker when activating Pro.
 */

const vscode = require('vscode');
const { findRepoRoot, getRecentCommits, getBlameData, getDiff } = require('./lib/git');
const { groupConsecutive } = require('./lib/blame');
const { HistoryTreeProvider } = require('./lib/treeProvider');
const { parseDiffLine, escapeHtml } = require('./lib/diffHtml');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_VERIFY_ENDPOINT = 'https://snapmark-license.463102527.workers.dev/verify';
const BLAME_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff'];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function readConfig() {
  const c = vscode.workspace.getConfiguration('gitlite');
  return {
    verifyEndpoint: (c.get('verifyEndpoint') || '').trim() || DEFAULT_VERIFY_ENDPOINT,
    buyoutLink: (c.get('buyoutLink') || '').trim()
  };
}

// ---------------------------------------------------------------------------
// Decoration management
// ---------------------------------------------------------------------------

/** Create decoration types once per activation; returns array of types. */
function createDecorationTypes(context) {
  const types = [];
  for (let i = 0; i < 5; i++) {
    const color = BLAME_COLORS[i];
    // Highlight type: colored left-border + background tint
    const highlightType = vscode.window.createTextEditorDecorationType({
      backgroundColor: `${color}20`,
      borderLeftWidth: 3,
      borderLeftStyle: 'solid',
      borderLeftColor: color,
      overviewRulerColor: color,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
    // Dot type: small colored dot in gutter
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="${color}"/></svg>`;
    const dotType = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`),
      gutterIconSize: 'contain',
      overviewRulerColor: color + '60',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
    types.push({ highlight: highlightType, dot: dotType });
    context.subscriptions.push(highlightType);
    context.subscriptions.push(dotType);
  }
  return types;
}

/** Apply blame decorations to editor using cached types. */
async function applyBlameDecorations(editor, decoTypes) {
  if (!editor || !editor.document) return;

  const uri = editor.document.uri;
  const repoRoot = findRepoRoot(uri);
  if (!repoRoot) {
    clearAllDecorations(editor, decoTypes);
    return;
  }

  const relPath = getRelativePath(uri, repoRoot);
  const blameData = getBlameData(repoRoot, relPath);
  if (blameData.size === 0) {
    clearAllDecorations(editor, decoTypes);
    return;
  }

  const sorted = [...blameData.entries()].sort((a, b) => a[0] - b[0]);
  const grouped = groupConsecutive(sorted,
    (a, b) => b[0] === a[0] + 1 && b[1].hash === a[1].hash
  );

  grouped.forEach((group, idx) => {
    const startLine = group[0][0];
    const endLine = group[group.length - 1][0];
    const colorIdx = idx % 5;
    const line = editor.document.lineAt(startLine - 1);
    const lastLine = editor.document.lineAt(endLine - 1);
    const fullRange = new vscode.Range(
      new vscode.Position(startLine - 1, 0),
      new vscode.Position(endLine - 1, lastLine.text.length)
    );
    const shortRange = new vscode.Range(
      new vscode.Position(startLine - 1, 0),
      new vscode.Position(startLine - 1, Math.min(5, line.text.length))
    );

    try {
      editor.setDecorations(decoTypes[colorIdx].highlight, [fullRange]);
      editor.setDecorations(decoTypes[colorIdx].dot, [shortRange]);
    } catch (_) { /* disposed */ }
  });
}

function clearAllDecorations(editor, decoTypes) {
  if (!editor || !decoTypes) return;
  decoTypes.forEach(({ highlight, dot }) => {
    try { editor.setDecorations(highlight, []); } catch (_) {}
    try { editor.setDecorations(dot, []); } catch (_) {}
  });
}

function getRelativePath(uri, repoRoot) {
  const fsPath = uri.fsPath;
  if (!fsPath.startsWith(repoRoot)) return fsPath;
  return fsPath.slice(repoRoot.length + 1);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function registerCommands(context) {
  let decoTypes = null;

  // Initialize decoration types on first use
  function ensureDecoTypes() {
    if (!decoTypes) {
      decoTypes = createDecorationTypes(context);
    }
    return decoTypes;
  }

  // Toggle inline blame
  context.subscriptions.push(vscode.commands.registerCommand('gitlite.toggleBlame', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('GitLite: open a file first.');
      return;
    }
    const pro = context.globalState.get('gitlitePro', false);
    await applyBlameDecorations(editor, ensureDecoTypes());
    vscode.window.showInformationMessage(
      `GitLite: inline blame ${pro ? '(Pro)' : ''} refreshed.`
    );
  }));

  // Show file history in sidebar
  context.subscriptions.push(vscode.commands.registerCommand('gitlite.openHistory', async () => {
    // The tree data provider is registered once in activate(). Just focus the
    // contributed view here; creating another createTreeView with the same id
    // would conflict with the contributed view.
    vscode.commands.executeCommand('gitlite-history.focus');
  }));

  // Open diff viewer webview
  context.subscriptions.push(vscode.commands.registerCommand('gitlite.openDiff', async (commitHash) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('GitLite: open a file first.');
      return;
    }

    const uri = editor.document.uri;
    const repoRoot = findRepoRoot(uri);
    if (!repoRoot) {
      vscode.window.showErrorMessage('GitLite: not in a git repository.');
      return;
    }

    const relPath = getRelativePath(uri, repoRoot);
    const commits = getRecentCommits(repoRoot, relPath);
    if (commits.length < 2) {
      vscode.window.showInformationMessage('GitLite: need at least 2 commits to show a diff.');
      return;
    }

    const commitB = commitHash || commits[0].hash;
    const commitAEntry = commits.find(c => c.hash !== commitB);
    const commitA = commitAEntry ? commitAEntry.hash : null;
    const diffOutput = getDiff(repoRoot, relPath, commitA || '', commitB);
    const isPro = context.globalState.get('gitlitePro', false) === true;

    const panel = vscode.window.createWebviewPanel(
      'gitliteDiff',
      `Diff: ${relPath}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: false,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    panel.webview.html = buildDiffPanelHtml(commitA, commitB, relPath, diffOutput, isPro);
  }));

  // Upgrade to Pro
  context.subscriptions.push(vscode.commands.registerCommand('gitlite.upgradeToPro', async () => {
    const cfg = readConfig();
    if (!cfg.buyoutLink) {
      vscode.window.showWarningMessage(
        'GitLite: set gitlite.buyoutLink in settings before upgrading.'
      );
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(cfg.buyoutLink));
  }));

  // Activate Pro (paste license key)
  context.subscriptions.push(vscode.commands.registerCommand('gitlite.activatePro', async () => {
    const license = await vscode.window.showInputBox({
      prompt: 'Enter your GitLite Pro license key',
      placeHolder: 'e.g. vs-xxxxxxxxxxxxxxxxxxxx',
      ignoreFocusOut: true
    });
    if (!license) return;

    const cfg = readConfig();
    const result = await verifyLicense(cfg.verifyEndpoint, license.trim());
    if (result.ok) {
      await context.globalState.update('gitlitePro', true);
      await context.globalState.update('gitliteLicense', license.trim());
      vscode.window.showInformationMessage(
        'GitLite: Pro license active. Advanced features (commit graph, batch export, multi-repo) coming in a future update.'
      );
      // Re-apply decorations if there's an active editor
      const editor = vscode.window.activeTextEditor;
      if (editor) await applyBlameDecorations(editor, ensureDecoTypes());
    } else {
      vscode.window.showErrorMessage(`GitLite: ${result.error || 'Invalid license key.'}`);
    }
  }));
}

// ---------------------------------------------------------------------------
// License helpers
// ---------------------------------------------------------------------------

async function verifyLicense(endpoint, license) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license })
    });
    const data = await res.json();
    return { ok: !!data.valid, error: data.valid ? '' : (data.error || 'License is not active.') };
  } catch (e) {
    return { ok: false, error: 'Could not reach license service: ' + String(e.message || e) };
  }
}

// ---------------------------------------------------------------------------
// Diff panel HTML
// ---------------------------------------------------------------------------

function buildDiffPanelHtml(commitA, commitB, filePath, diffText, isPro) {
  const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src 'none';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.5; color: #24292f; background: #ffffff; padding: 16px; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { border-bottom: 1px solid #eaeaea; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 16px; font-weight: 600; }
    .path { font-size: 12px; color: #6e7781; margin-top: 4px; font-family: 'SF Mono', Monaco, Consolas, monospace; }
    .diff-line { display: flex; gap: 0; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 12px; white-space: pre; }
    .diff-line-num { width: 40px; text-align: right; padding: 0 8px; color: #6e7781; user-select: none; flex-shrink: 0; }
    .diff-line-content { flex: 1; padding: 0 8px; white-space: pre-wrap; word-break: break-all; }
    .added .diff-line-content { background: #dafbe1; color: #116329; }
    .removed .diff-line-content { background: #ffebe9; color: #cf222e; }
    .hunk { background: #dadbd3; color: #444; font-weight: 600; }
    .meta { color: #6e7781; font-style: italic; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eaeaea; font-size: 11px; color: #6e7781; }
    .no-diff { padding: 24px; color: #6e7781; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Diff: ${commitA ? shortHash(commitA) : 'Working Tree'} → ${shortHash(commitB)}</h1>
      <p class="path">${escapeHtml(filePath)}</p>
    </div>
    <div id="diffContent"></div>
    <div class="footer">
      <p>Generated by <strong>GitLite</strong>. Your code never leaves your machine.</p>
      ${isPro ? '' : '<p style="margin-top:4px;color:#8e9aa8;">Upgrade to Pro for commit graph visualisation and batch export.</p>'}
    </div>
  </div>
</body>
</html>`;

  if (!diffText) {
    return header.replace('<div id="diffContent"></div>',
      '<div id="diffContent" class="no-diff">No changes between these commits.</div>');
  }

  const lines = diffText.split('\n');
  let ctxStartA = 0, ctxStartB = 0;
  let htmlLines = [];

  for (const line of lines) {
    if (!line) continue;
    const parsed = parseDiffLine(line);

    if (parsed.type === 'hunk') {
      const match = parsed.value.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        ctxStartA = parseInt(match[1], 10);
        ctxStartB = parseInt(match[2], 10);
      }
    }

    if (parsed.type === 'added') {
      htmlLines.push(`<div class="diff-line added"><span class="diff-line-num">${ctxStartB++}</span><span class="diff-line-content">${escapeHtml(parsed.value)}</span></div>`);
    } else if (parsed.type === 'removed') {
      htmlLines.push(`<div class="diff-line removed"><span class="diff-line-num">${ctxStartA++}</span><span class="diff-line-content">${escapeHtml(parsed.value)}</span></div>`);
    } else if (parsed.type === 'context') {
      htmlLines.push(`<div class="diff-line"><span class="diff-line-num">${ctxStartA++}</span><span class="diff-line-content">${escapeHtml(parsed.value)}</span></div>`);
      ctxStartB++;
    } else {
      htmlLines.push(`<div class="diff-line meta"><span class="diff-line-num"></span><span class="diff-line-content">${escapeHtml(parsed.value)}</span></div>`);
    }
  }

  return header.replace('<div id="diffContent"></div>',
    `<div id="diffContent">${htmlLines.join('\n')}</div>`);
}

function shortHash(hash) {
  return hash ? hash.slice(0, 8) : '';
}

// ---------------------------------------------------------------------------
// Activate / Deactivate
// ---------------------------------------------------------------------------

function activate(context) {
  // Register the File History tree view data provider so the contributed
  // view (gitlite-history) has data. Using createTreeView with the same id
  // as a contributed view causes a conflict; registerTreeDataProvider binds
  // the provider directly to the contributed view.
  const historyProvider = new HistoryTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('gitlite-history', historyProvider)
  );

  registerCommands(context);

  // Auto-refresh decorations when switching editors
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor) return;
    await applyBlameDecorations(editor, getOrCreateDecoTypes(context));
  });
  context.subscriptions.push(activeEditorListener);

  // Welcome message on first install
  if (!context.globalState.get('gitliteWelcomed', false)) {
    context.globalState.update('gitliteWelcomed', true);
    vscode.window.showInformationMessage(
      'GitLite installed! Right-click any file → GitLite: Toggle Inline Blame to see author attribution per line. For advanced features (commit graph, batch export, multi-repo), use GitLite: Upgrade to Pro from the command palette.'
    );
  }
}

// Lazily-initialised decoration types cache (module-level)
let _cachedDecoTypes = null;
let _cachedContext = null;

function getOrCreateDecoTypes(ctx) {
  if (!_cachedDecoTypes || _cachedContext !== ctx) {
    _cachedDecoTypes = createDecorationTypes(ctx);
    _cachedContext = ctx;
  }
  return _cachedDecoTypes;
}

function deactivate() {
  _cachedDecoTypes = null;
  _cachedContext = null;
}

module.exports = { activate, deactivate };
