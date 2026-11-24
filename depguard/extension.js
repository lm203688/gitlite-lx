'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const scanEngine = require('./lib/scan');
const aiExplain = require('./lib/aiExplain');
const { ResultTreeProvider } = require('./lib/treeProvider');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWsRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0]?.uri.fsPath || process.cwd();
}

function readCfg() {
  const c = vscode.workspace.getConfiguration('depguard');
  return {
    verifyEndpoint: (c.get('verifyEndpoint') || '').trim() || 'https://snapmark-license.463102527.workers.dev/verify',
    buyoutLink:     (c.get('buyoutLink') || '').trim(),
    aiProvider:     c.get('aiProvider') || 'openai',
    aiApiKey:       (c.get('aiApiKey') || '').trim(),
  };
}

async function verifyLicense(endpoint, license) {
  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license }),
    });
    const data = await res.json();
    return { ok: !!data.valid, error: data.valid ? '' : (data.error || 'License is not active.') };
  } catch (e) {
    return { ok: false, error: 'Could not reach license service: ' + String(e.message || e) };
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

function registerCommands(context) {
  const treeProvider = new ResultTreeProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('depguard-results', treeProvider)
  );

  // ── Scan project ─────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.scanProject', async () => {
    const wsRoot = getWsRoot();
    if (!wsRoot) {
      vscode.window.showErrorMessage('DepGuard: no workspace folder open.');
      return;
    }
    const isPro = context.globalState.get('depguard_pro', false);
    const cfg = readCfg();

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'DepGuard: Scanning dependencies …',
      cancellable: false,
    }, async () => {
      const result = await scanEngine.runScan(wsRoot);
      if (!result.ok) {
        vscode.window.showErrorMessage(`DepGuard: scan failed — ${result.error}`);
        return;
      }
      await scanEngine.saveResults(context, result.data);
      treeProvider.setResults(result.data, isPro);
      treeProvider.refresh();

      const summary = result.data.summary || {};
      const critical = summary.critical ?? summary.criticalOrHigher ?? 0;
      const high     = summary.high ?? 0;
      const medium   = summary.medium ?? 0;
      const low      = summary.low ?? 0;

      if (critical > 0 || high > 0) {
        vscode.window.showWarningMessage(
          `DepGuard: found ${critical} critical + ${high} high vulnerability(ies). Review results in the DepGuard panel.`
        );
      } else {
        vscode.window.showInformationMessage('DepGuard: scan complete — no critical or high vulnerabilities found.');
      }
    });
  }));

  // ── Clear results ────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.clearResults', async () => {
    await scanEngine.clearResults(context);
    treeProvider.setResults(null, context.globalState.get('depguard_pro', false));
    treeProvider.refresh();
    vscode.window.showInformationMessage('DepGuard: results cleared.');
  }));

  // ── Export HTML report ───────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.exportHtml', async () => {
    const data = context.globalState.get('depguard_lastResult', null);
    if (!data) {
      vscode.window.showWarningMessage('DepGuard: no scan results to export. Run a scan first.');
      return;
    }
    const html = scanEngine.renderHtmlReport(data);
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(getWsRoot(), 'depguard-report.html')),
      filters: { 'HTML': ['html'] },
    });
    if (!uri) return;
    fs.writeFileSync(uri.fsPath, html, 'utf8');
    vscode.window.showInformationMessage(`DepGuard: report saved to ${path.basename(uri.fsPath)}.`);
  }));

  // ── Show CVE detail (click on item in tree) ──────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.showCveDetail', async (cveId) => {
    const data = context.globalState.get('depguard_lastResult', null);
    if (!data || !data.vulnerabilities) return;
    const vuln = data.vulnerabilities.find(v => v.id === cveId || v.title?.includes(cveId));
    if (!vuln) {
      vscode.window.showWarningMessage('DepGuard: CVE details not available for this entry.');
      return;
    }
    const md = `## ${vuln.title || vuln.id}\n\n**Severity**: ${vuln.severity || 'unknown'}\n\n${vuln.recommendation || vuln.detail || 'No details available.'}`;
    const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
    await vscode.window.showTextDocument(doc);
  }));

  // ── Upgrade to Pro ───────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.upgradeToPro', async () => {
    const cfg = readCfg();
    if (!cfg.buyoutLink) {
      vscode.window.showWarningMessage('DepGuard: set depguard.buyoutLink in settings before upgrading.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(cfg.buyoutLink));
  }));

  // ── Activate Pro ─────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('depguard.activatePro', async () => {
    const license = await vscode.window.showInputBox({
      prompt:         'Enter your DepGuard Pro license key',
      placeHolder:    'e.g. dg-xxxxxxxxxxxxxxxxxxxx',
      ignoreFocusOut: true,
    });
    if (!license) return;
    const cfg   = readCfg();
    const result = await verifyLicense(cfg.verifyEndpoint, license.trim());
    if (result.ok) {
      await context.globalState.update('depguard_pro', true);
      await context.globalState.update('dg_license', license.trim());
      treeProvider.setResults(
        context.globalState.get('depguard_lastResult', null),
        true
      );
      treeProvider.refresh();
      vscode.window.showInformationMessage('DepGuard: Pro license active! PDF export and AI fix explanations unlocked.');
    } else {
      vscode.window.showErrorMessage(`DepGuard: ${result.error || 'Invalid license key.'}`);
    }
  }));
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

async function activate(context) {
  registerCommands(context);

  // Restore last scan results on reload
  const lastResult = context.globalState.get('depguard_lastResult', null);
  const treeProvider = context.subscriptions.find(s => s instanceof vscode.Disposable)
    ? null
    : new ResultTreeProvider(context);

  if (!context.globalState.get('dg_welcomed', false)) {
    context.globalState.update('dg_welcomed', true);
    vscode.window.showInformationMessage(
      'DepGuard installed! Open a Node.js or Python project, then press Ctrl+Alt+S to scan for vulnerabilities.'
    );
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
