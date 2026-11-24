'use strict';

const vscode = require('vscode');
const tasks = require('./lib/tasks');
const { TaskTreeProvider } = require('./lib/treeProvider');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCfg() {
  const c = vscode.workspace.getConfiguration('flowtasks');
  return {
    verifyEndpoint: (c.get('verifyEndpoint') || '').trim() || 'https://snapmark-license.463102527.workers.dev/verify',
    buyoutLink:     (c.get('buyoutLink') || '').trim(),
    maxFreeGroups:  c.get('maxFreeGroups') || 5,
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
  const treeProvider = new TaskTreeProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('flowtasks-groups', treeProvider)
  );

  // ── List / Refresh ─────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.listGroups', () => {
    treeProvider.refresh();
  }));

  // ── Create new group ───────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.createGroup', async () => {
    const cfg  = readCfg();
    const isPro = context.globalState.get('flowtasks_pro', false);

    if (!isPro) {
      const groups = await tasks.loadGroups(context);
      if (groups.length >= cfg.maxFreeGroups) {
        vscode.window.showWarningMessage(
          `FlowTasks: Free tier limited to ${cfg.maxFreeGroups} groups. Upgrade to Pro for unlimited groups → Ctrl+Shift+P → FlowTasks: Upgrade to Pro`
        );
        return;
      }
    }

    const name = await vscode.window.showInputBox({
      prompt:         'Group name (e.g., "Build & Test")',
      placeHolder:    'My Task Group',
      ignoreFocusOut: true,
    });
    if (name === undefined) return;

    const steps = await vscode.window.showInputBox({
      prompt:         'Steps (one per line, e.g. "npm install\nnpm run build")',
      placeHolder:    'npm install\nnpm run test\nnpm run lint',
      ignoreFocusOut: true,
      value:          '',
    });
    if (steps === undefined) return;

    const group = await tasks.addGroup(context, { name, steps: steps.split('\n').map(s => s.trim()).filter(Boolean) });
    if (!group.ok) {
      vscode.window.showErrorMessage(`FlowTasks: ${group.error}`);
      return;
    }
    treeProvider.refresh();
    vscode.window.showInformationMessage(`FlowTasks: group "${group.group.name}" created.`);
  }));

  // ── Execute a single group ─────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.executeGroup', async (groupId) => {
    const group = await tasks.getGroup(context, groupId);
    if (!group) {
      vscode.window.showErrorMessage('FlowTasks: group not found.');
      return;
    }
    await tasks.runGroup(context, group);
    treeProvider.refresh();
  }));

  // ── Execute all groups ─────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.executeAll', async () => {
    const groups = await tasks.loadGroups(context);
    if (!groups.length) {
      vscode.window.showWarningMessage('FlowTasks: no groups defined.');
      return;
    }
    const confirm = await vscode.window.showWarningMessage(
      `Execute all ${groups.length} group(s)? This will run commands in the terminal.`,
      { modal: true }, 'Run All', 'Cancel'
    );
    if (confirm !== 'Run All') return;
    let lastResult = null;
    for (const g of groups) {
      lastResult = await tasks.runGroup(context, g);
    }
    if (lastResult && !lastResult.ok) {
      vscode.window.showErrorMessage(`FlowTasks: some groups failed. Check output.`);
    } else {
      vscode.window.showInformationMessage(`FlowTasks: all groups executed (${groups.length}).`);
    }
    treeProvider.refresh();
  }));

  // ── Rename group ───────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.renameGroup', async (groupId) => {
    const group = await tasks.getGroup(context, groupId);
    if (!group) return;
    const newName = await vscode.window.showInputBox({
      prompt:         'New group name',
      value:          group.name,
      ignoreFocusOut: true,
    });
    if (newName === undefined) return;
    const result = await tasks.renameGroup(context, groupId, newName);
    if (!result.ok) { vscode.window.showErrorMessage(result.error); return; }
    treeProvider.refresh();
    vscode.window.showInformationMessage('FlowTasks: group renamed.');
  }));

  // ── Delete group ───────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.deleteGroup', async (groupId) => {
    const result = await tasks.deleteGroup(context, groupId);
    if (!result.ok) { vscode.window.showErrorMessage(result.error); return; }
    treeProvider.refresh();
    vscode.window.showInformationMessage('FlowTasks: group deleted.');
  }));

  // ── Upgrade to Pro ─────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.upgradeToPro', async () => {
    const cfg = readCfg();
    if (!cfg.buyoutLink) {
      vscode.window.showWarningMessage('FlowTasks: set flowtasks.buyoutLink in settings before upgrading.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(cfg.buyoutLink));
  }));

  // ── Activate Pro ───────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('flowtasks.activatePro', async () => {
    const license = await vscode.window.showInputBox({
      prompt:         'Enter your FlowTasks Pro license key',
      placeHolder:    'e.g. tf-xxxxxxxxxxxxxxxxxxxx',
      ignoreFocusOut: true,
    });
    if (!license) return;
    const cfg   = readCfg();
    const result = await verifyLicense(cfg.verifyEndpoint, license.trim());
    if (result.ok) {
      await context.globalState.update('flowtasks_pro', true);
      await context.globalState.update('tf_license', license.trim());
      treeProvider.refresh();
      vscode.window.showInformationMessage('FlowTasks: Pro license active! Unlimited groups unlocked.');
    } else {
      vscode.window.showErrorMessage(`FlowTasks: ${result.error || 'Invalid license key.'}`);
    }
  }));
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

async function activate(context) {
  registerCommands(context);

  if (!context.globalState.get('tf_welcomed', false)) {
    context.globalState.update('tf_welcomed', true);
    vscode.window.showInformationMessage(
      'FlowTasks installed! Create your first task group using Ctrl+Alt+N or the + button above.'
    );
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
