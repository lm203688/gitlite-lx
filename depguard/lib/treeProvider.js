'use strict';

const vscode = require('vscode');
const { SEVERITY_COLORS } = require('./scan');

class ResultTreeProvider {
  constructor(context) {
    this._ctx       = context;
    this._results   = null;
    this._isPro     = false;
    this._onDidChange = new vscode.EventEmitter();
  }

  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  /** Call after loading fresh scan results. */
  setResults(data, isPro) {
    this._results  = data;
    this._isPro    = isPro;
    this._onDidChange.fire();
  }

  resolveTreeItem(element) { return element; }
  getTreeItem(element)      { return element; }

  async getChildren() {
    if (!this._results || !this._results.vulnerabilities) {
      return [{
        id:             '__empty__',
        label:          '(Run a scan first — Ctrl+Alt+S)',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        description:    '',
        tooltip:        'Open a project and press Ctrl+Alt+S to scan dependencies.',
        contextValue:   '__empty__',
        iconPath:       new vscode.ThemeIcon('play'),
      }];
    }

    const items = [];
    const summary = this._results.summary || {};

    // ── Summary badges ───────────────────────────────────────────────────
    for (const sev of ['critical', 'high', 'medium', 'low']) {
      const count = summary[sev] || 0;
      if (count === 0) continue;
      const color = SEVERITY_COLORS[sev] || '#888';
      const item = new vscode.TreeItem(
        `${sev.toUpperCase()}: ${count}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.id           = `summary_${sev}`;
      item.contextValue = `summary_${sev}`;
      item.iconPath     = new vscode.ThemeIcon('circle-filled', color);
      item.tooltip      = `${count} ${sev} severity vulnerability(ies)`;
      items.push(item);
    }

    if (!items.length) {
      items.push(new vscode.TreeItem(
        '[OK] No critical or high vulnerabilities found',
        vscode.TreeItemCollapsibleState.None
      ));
    }

    // ── Vulnerability list (sorted by severity) ─────────────────────────
    const sorted = [...this._results.vulnerabilities].sort((a, b) => {
      return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    });

    for (const v of sorted) {
      const color = SEVERITY_COLORS[v.severity] || '#888';
      const item = new vscode.TreeItem(
        `[${(v.severity || '?').toUpperCase()}] ${v.title || v.id}`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id          = `cve_${v.id || v.title}`;
      item.contextValue = `cve_${(v.severity || 'unknown').toLowerCase()}`;
      item.description = (v.recommendation || '').slice(0, 40);
      item.tooltip     = this._buildTooltip(v);
      item.iconPath    = new vscode.ThemeIcon('circle-filled', color);
      item.command     = { command: 'depguard.showCveDetail', title: 'Show details', arguments: [v.id || v.title] };
      items.push(item);
    }

    return items;
  }

  async getChildren(element) {
    if (!element || !element.id.startsWith('cve_')) return [];
    const vuln = this._results?.vulnerabilities?.find(
      v => (v.id || v.title) === element.id.replace('cve_', '')
    );
    if (!vuln) return [];

    const lines = [];
    if (vuln.url)      lines.push({ label: '🔗 Advisory URL', value: vuln.url });
    if (vuln.affectedVersions) lines.push({ label: '📦 Affected Versions', value: vuln.affectedVersions });
    if (vuln.recommendation)    lines.push({ label: '🛠 Recommendation', value: vuln.recommendation });

    // AI explanation (Pro only, Phase 2 placeholder)
    if (this._isPro) {
      lines.push({ label: '🤖 AI Fix Explanation', value: '[Phase 2 - Upcoming]' });
    }

    return lines.map(l => {
      const item = new vscode.TreeItem(l.label, vscode.TreeItemCollapsibleState.None);
      item.id          = `${element.id}_${l.label}`;
      item.description = l.value;
      item.tooltip     = l.value;
      item.iconPath    = new vscode.ThemeIcon('symbol-property');
      return item;
    });
  }

  _buildTooltip(v) {
    const parts = [];
    parts.push(`Severity: ${v.severity || 'unknown'}`);
    if (v.affectedVersions) parts.push(`Affected: ${v.affectedVersions}`);
    if (v.recommendation)   parts.push(`Fix: ${v.recommendation}`);
    if (v.url)              parts.push(`URL: ${v.url}`);
    return parts.join('\n');
  }
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

module.exports = { ResultTreeProvider };
