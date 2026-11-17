/**
 * GitLite — lib/treeProvider.js
 *
 * TreeDataProvider for the File History sidebar view (plain JS, no TS syntax).
 */

const vscode = require('vscode');
const { getRecentCommits, findRepoRoot } = require('./git');

class HistoryTreeItem extends vscode.TreeItem {
  constructor(label, commit) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.commit = commit;
    this.iconPath = new vscode.ThemeIcon('git-commit');
    this.tooltip = `${commit.hash}\n${commit.author} · ${commit.date}`;
    this.description = commit.message.split('\n')[0].slice(0, 40);
    this.command = {
      command: 'gitlite.openDiff',
      title: 'GitLite: Diff with Previous Version',
      arguments: [commit.hash]
    };
  }
}

class HistoryTreeProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
  }

  get onDidChangeTreeData() {
    return this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  async getChildren(element) {
    if (element) return []; // leaf items have no children

    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];

    const uri = editor.document.uri;
    const repoRoot = findRepoRoot(uri);
    if (!repoRoot) {
      return [new vscode.TreeItem('Not in a git repository', vscode.TreeItemCollapsibleState.None)];
    }

    const relPath = getRelativePath(uri, repoRoot);
    const commits = getRecentCommits(repoRoot, relPath);

    if (commits.length === 0) {
      return [new vscode.TreeItem('No commits found for this file', vscode.TreeItemCollapsibleState.None)];
    }

    return commits.map(c => new HistoryTreeItem(`[${c.hash.slice(0, 8)}] ${c.message}`, c));
  }
}

function getRelativePath(uri, repoRoot) {
  const fsPath = uri.fsPath;
  if (!fsPath.startsWith(repoRoot)) return fsPath;
  return fsPath.slice(repoRoot.length + 1);
}

module.exports = { HistoryTreeProvider };
