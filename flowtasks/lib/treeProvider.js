'use strict';

const vscode = require('vscode');
const tasks   = require('./tasks');

class TaskTreeProvider {
  constructor(context) {
    this._ctx  = context;
    this._onDidChange = new vscode.EventEmitter();
  }

  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  resolveTreeItem(element) { return element; }
  getTreeItem(element)      { return element; }

  async getChildren() {
    const groups  = await tasks.loadGroups(this._ctx);
    const isPro   = this._ctx.globalState.get('flowtasks_pro', false);
    const history = await tasks.getHistory(this._ctx);

    const items = [];

    // ── Task groups ────────────────────────────────────────────────────────
    for (const g of groups) {
      const item = new vscode.TreeItem(
        `📋 ${g.name}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.id             = `group_${g.id}`;
      item.description    = `${g.steps.length} step(s)`;
      item.tooltip        = `Steps:\n${g.steps.map(s => '  ' + s).join('\n')}`;
      item.contextValue   = 'group_';
      item.iconPath       = new vscode.ThemeIcon('symbol-event');
      item.command        = { command: 'flowtasks.executeGroup', title: 'Execute', arguments: [g.id] };
      items.push(item);
    }

    // ── Empty state ────────────────────────────────────────────────────────
    if (!groups.length) {
      const hint = isPro
        ? 'No groups yet. Press Ctrl+Alt+N to create one, or use the + button.'
        : `No groups yet (Free limit: ${this._ctx.globalState.get('__tf_maxFreeGroups', 5)} groups).`;
      items.push({
        id:           '__empty__',
        label:        '(No task groups yet)',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        description:  '',
        tooltip:      hint,
        contextValue: '__empty__',
        iconPath:     new vscode.ThemeIcon('info'),
      });
    }

    // ── Recent executions (Pro feature, shown when available) ─────────────
    if (isPro && history.length) {
      const recent = history.slice(0, 5);
      for (const h of recent) {
        const time = new Date(h.timestamp).toLocaleString();
        const item = new vscode.TreeItem(
          `${h.success ? '✅' : '❌'} ${h.groupName} · ${time}`,
          vscode.TreeItemCollapsibleState.None
        );
        item.id          = `hist_${h.timestamp}`;
        item.contextValue = 'history_item';
        item.tooltip     = `Group: ${h.groupName}\nTime: ${time}\nSuccess: ${h.success}`;
        items.push(item);
      }
    }

    return items;
  }
}

module.exports = { TaskTreeProvider };
