/**
 * GitLite — lib/git.js
 *
 * Lightweight git CLI helpers. All commands run locally via Node child_process.
 * No code ever leaves the machine.
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * Run a git command in rootDir and return stdout trimmed.
 * Returns null (not throws) when the repo is invalid or command fails.
 */
function safeExec(gitArgs, rootDir) {
  try {
    const out = execSync(`git ${gitArgs.join(' ')}`, {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10 MB safety cap
    }).trim();
    return out || null;
  } catch (e) {
    return null;
  }
}

/**
 * Check whether `uri` lives inside a git repository.
 * Returns the repo root path string, or null if not in a git repo.
 */
function findRepoRoot(uri) {
  // cwd must be a directory, not a file path. A file uri.fsPath points to a
  // file; git rev-parse fails when cwd is a file, so walk up to the dirname.
  const dir = path.dirname(uri.fsPath);
  const root = safeExec(['rev-parse', '--show-toplevel'], dir);
  return root ? root : null;
}

/**
 * Get recent commits for `filePath` relative to `repoRoot`.
 * Returns array of { hash, author, date, message }.
 */
function getRecentCommits(repoRoot, filePath) {
  const output = safeExec(
    ['log', '--pretty=format:"%H|%an|%ad|%s"', '-n', '50', '--date=short', '--', filePath],
    repoRoot
  );
  if (!output) return [];
  return output.split('\n').map(line => {
    // Format: "HASH|AUTHOR|DATE|MESSAGE" — git does NOT emit the surrounding
    // quotes; they are only in the --pretty=format string. So split directly.
    const parts = line.split('|');
    if (parts.length < 4) return null;
    const hash = parts[0];
    const author = parts[1];
    const date = parts[2];
    const message = parts.slice(3).join('|');
    return { hash, author, date, message };
  }).filter(Boolean);
}

/**
 * Get blame porcelain output for `filePath` (unmerged lines prefixed with tab).
 * Each non-tab line is: HASH DATE LINE_NUM AUTHOR
 * Tab-prefixed lines are the actual content.
 * Returns Map<number, { hash, shortHash, author, date }> keyed by 1-based line number.
 */
function getBlameData(repoRoot, filePath) {
  // Use --porcelain=v1 for stable parsing
  const output = safeExec(
    ['blame', '--porcelain=v1', '--line-porcelain', '--date=short', '--', filePath],
    repoRoot
  );
  if (!output) return new Map();

  const result = new Map();
  const lines = output.split('\n');
  let currentHash = null;
  let currentAuthor = '';
  let currentDate = '';
  let lineNumber = null;

  for (const line of lines) {
    if (line.startsWith('\t')) {
      // Content line — skip (we don't need it here)
      continue;
    }

    // Header line: original-hash timestamp original-line final-line ...
    const match = line.match(/^([0-9a-f]{40,})\s+(\d+)\s+(\d+)/);
    if (match) {
      currentHash = match[1];
      lineNumber = parseInt(match[3], 10);
      continue;
    }

    // Author line: author NAME
    const authorMatch = line.match(/^author\s+(.+)$/);
    if (authorMatch) {
      currentAuthor = authorMatch[1];
      continue;
    }

    // Author-time line: author-time TIMESTAMP
    const timeMatch = line.match(/^author-time\s+(\d+)/);
    if (timeMatch && lineNumber !== null) {
      const date = new Date(parseInt(timeMatch[1], 10) * 1000).toISOString().slice(0, 10);
      result.set(lineNumber, {
        hash: currentHash,
        shortHash: currentHash.slice(0, 8),
        author: currentAuthor,
        date
      });
    }

    // When we hit a new header without a timestamp, reset
    if (line.match(/^[0-9a-f]{40,}/) && !line.includes('\t')) {
      currentHash = null;
      lineNumber = null;
    }
  }

  return result;
}

/**
 * Get unified diff between two commits (or HEAD and working tree).
 * commitA = older (left), commitB = newer (right), or '' for working tree.
 * Returns diff string (unified format).
 */
function getDiff(repoRoot, filePath, commitA, commitB) {
  const args = ['diff'];
  if (commitA && commitB) {
    args.push(`${commitA}..${commitB}`);
  } else if (commitA) {
    args.push(commitA, '--');
  } else {
    args.push('--', filePath); // staged vs HEAD or working tree
  }
  args.push('--', filePath);
  return safeExec(args, repoRoot) || '';
}

/**
 * List all commit hashes for `filePath`, newest first.
 */
function getAllCommitHashes(repoRoot, filePath) {
  const output = safeExec(
    ['log', '--pretty=format:%H', '--reverse', '--', filePath],
    repoRoot
  );
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

module.exports = {
  findRepoRoot,
  getRecentCommits,
  getBlameData,
  getDiff,
  getAllCommitHashes
};
