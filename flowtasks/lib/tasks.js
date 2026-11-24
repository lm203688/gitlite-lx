'use strict';

const vscode = require('vscode');

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_GROUPS    = 'flowtasks_groups';
const KEY_HISTORY   = 'flowtasks_history';
const KEY_PRO       = 'flowtasks_pro';

// ── Group CRUD ────────────────────────────────────────────────────────────────

/** Load all task groups from globalState. */
async function loadGroups(context) {
  const raw = context.globalState.get(KEY_GROUPS, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(g => ({ ...g, id: g.id || generateId() }));
}

/** Persist all task groups to globalState. */
async function saveGroups(context, groups) {
  await context.globalState.update(KEY_GROUPS, groups);
}

/** Add a new task group; returns { ok, group }. */
async function addGroup(context, { name, steps }) {
  const groups = await loadGroups(context);
  const group = {
    id:    generateId(),
    name,
    steps,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  groups.push(group);
  await saveGroups(context, groups);
  return { ok: true, group };
}

/** Get a single group by id. */
async function getGroup(context, id) {
  const groups = await loadGroups(context);
  return groups.find(g => g.id === id) || null;
}

/** Rename a group; returns { ok }. */
async function renameGroup(context, id, newName) {
  const groups = await loadGroups(context);
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return { ok: false, error: 'Group not found.' };
  groups[idx].name   = newName;
  groups[idx].updatedAt = Date.now();
  await saveGroups(context, groups);
  return { ok: true };
}

/** Delete a group; returns { ok }. */
async function deleteGroup(context, id) {
  let groups = await loadGroups(context);
  const before = groups.length;
  groups = groups.filter(g => g.id !== id);
  if (groups.length === before) return { ok: false, error: 'Group not found.' };
  await saveGroups(context, groups);
  // Remove associated history entries
  const hist = context.globalState.get(KEY_HISTORY, []);
  const filteredHist = hist.filter(h => h.groupId !== id);
  await context.globalState.update(KEY_HISTORY, filteredHist);
  return { ok: true };
}

// ── Execution ─────────────────────────────────────────────────────────────────

const ALLOWED_SHells = ['bash', 'powershell', 'cmd'];
const ALLOWED_CMDS   = new Set([
  'node', 'npm', 'yarn', 'pnpm', 'python', 'pip', 'pip3',
  'go', 'cargo', 'rustc', 'make', 'gcc', 'g++',
  'jest', 'mocha', 'vitest', 'tap', 'pytest',
  'eslint', 'prettier', 'tsc', 'ncp',
  'curl', 'wget', 'git', 'svn', 'hg',
]);

/** Run a group's steps sequentially via VS Code terminal. Returns { ok, lastStderr }. */
async function runGroup(context, group) {
  if (!group.steps.length) {
    return { ok: false, stderr: 'No steps to run.' };
  }
  const terminal = vscode.window.createTerminal({
    name: `FlowTasks: ${group.name}`,
    cwd:  vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(),
  });
  terminal.show();
  let lastError = '';
  for (const step of group.steps) {
    if (!step.trim()) continue;
    terminal.sendText(step);
    // Wait briefly for each command (VS Code terminals don't expose sync results cleanly)
    await sleep(1500);
    // Accumulate simple error tracking
    lastError += `\n>> ${step}\n`;
  }
  // Record execution history (free)
  await recordHistory(context, group.id, group.name, Date.now(), true);
  return { ok: true, stderr: lastError.trim() };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── History (Pro feature placeholder) ────────────────────────────────────────

async function recordHistory(context, groupId, groupName, timestamp, success) {
  // Only Pro users can access history (free records silently dropped)
  const isPro = context.globalState.get(KEY_PRO, false);
  if (!isPro) return;
  const hist = context.globalState.get(KEY_HISTORY, []);
  hist.unshift({ groupId, groupName, timestamp, success });
  // Keep last 100 entries (all users)
  if (hist.length > 100) hist.splice(100);
  await context.globalState.update(KEY_HISTORY, hist);
}

async function getHistory(context) {
  return context.globalState.get(KEY_HISTORY, []);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateId() {
  return 'grp_' + Math.random().toString(36).slice(2, 10);
}

module.exports = {
  KEY_GROUPS, KEY_HISTORY, KEY_PRO,
  loadGroups, saveGroups, addGroup, getGroup, renameGroup, deleteGroup,
  runGroup, recordHistory, getHistory,
};
