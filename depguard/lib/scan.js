'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Severity colour map ───────────────────────────────────────────────────────

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_COLORS = {
  critical: '#ff4444',
  high:     '#ff8800',
  medium:   '#ffbb33',
  low:      '#33b5e5',
  info:     '#888888',
};

// ── Scan engine ───────────────────────────────────────────────────────────────

/**
 * Run local scan via npm audit (for Node.js projects).
 * Returns parsed data suitable for display.
 */
async function runNpmAudit(workspaceRoot) {
  return new Promise((resolve) => {
    execFile('npm', ['audit', '--json'], {
      cwd: workspaceRoot,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
    }, (err, stdout, stderr) => {
      if (err) {
        // npm audit exits non-zero when vulnerabilities are found — that's expected
        if (stdout) {
          try {
            resolve({ ok: true, raw: JSON.parse(stdout) });
          } catch (_) {
            resolve({ ok: false, error: 'npm audit returned invalid JSON: ' + stdout.slice(0, 200) });
          }
        } else {
          resolve({ ok: false, error: stderr || 'npm audit exited with error' });
        }
        return;
      }
      try {
        resolve({ ok: true, raw: JSON.parse(stdout) });
      } catch (_) {
        resolve({ ok: false, error: 'Failed to parse npm audit output' });
      }
    });
  });
}

/**
 * Parse npm audit JSON into structured vulnerability list + summary.
 */
function parseAuditResult(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid audit result format' };
  }
  const vulnerabilities = [];
  const meta = raw.metadata || {};
  const vulnMap = raw.vulnerability || {};

  for (const [id, info] of Object.entries(vulnMap)) {
    if (!id.startsWith('audit')) {
      vulnerabilities.push({
        id,
        title: info.title || id,
        severity: (info.severity || 'unknown').toLowerCase(),
        url: info.url || '',
        recommendation: info.remediation || info.fixRecommendation || '',
        detail: info.overview || info.description || '',
        affectedVersions: info.affected_versions || info.affected || '',
        patchedVersions: info.patched_versions || info.fix_versions || '',
      });
    }
  }

  // Build summary counts
  const summary = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0, total: vulnerabilities.length,
  };
  for (const v of vulnerabilities) {
    const sev = v.severity || 'info';
    if (summary[sev] !== undefined) summary[sev]++;
    else summary.info++;
  }

  return { ok: true, vulnerabilities, summary, scannedAt: Date.now(), source: 'npm_audit' };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Run full scan; returns { ok, data }. */
async function runScan(workspaceRoot) {
  const r = await runNpmAudit(workspaceRoot);
  if (!r.ok) return r;
  const parsed = parseAuditResult(r.raw);
  if (!parsed.ok) return parsed;
  return parsed;
}

/** Save scan results to VS Code globalState. */
async function saveResults(context, data) {
  await context.globalState.update('depguard_lastResult', data);
}

/** Clear stored scan results. */
async function clearResults(context) {
  await context.globalState.update('depguard_lastResult', null);
}

/** Get stored results, or null. */
function getLastResults(context) {
  return context.globalState.get('depguard_lastResult', null);
}

// ── Report generation ─────────────────────────────────────────────────────────

function renderHtmlReport(data) {
  if (!data || !data.vulnerabilities) {
    return '<html><body><p>No scan results.</p></body></html>';
  }
  const summary = data.summary || {};
  const rows = data.vulnerabilities.map(v => {
    const color = SEVERITY_COLORS[v.severity] || '#888';
    return `<tr>
      <td><span style="color:${color};font-weight:bold">${(v.severity || '?').toUpperCase()}</span></td>
      <td>${escapeHtml(v.title || v.id)}</td>
      <td>${escapeHtml(v.affectedVersions || '-')}</td>
      <td>${escapeHtml(v.recommendation || 'See advisory URL')}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DepGuard Security Report</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  h1 { color: #222; } h2 { margin-top: 2rem; color: #333; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f5f5f5; }
  .summary { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
  .badge { padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; }
</style>
</head>
<body>
<h1>DepGuard Security Report</h1>
<p>Generated: ${new Date(data.scannedAt || Date.now()).toLocaleString()} · Source: ${data.source || 'unknown'}</p>
<div class="summary">
  ${(summary.critical  ? `<span class="badge" style="background:${SEVERITY_COLORS.critical}">Critical: ${summary.critical}</span>` : '')}
  ${(summary.high     ? `<span class="badge" style="background:${SEVERITY_COLORS.high}">High: ${summary.high}</span>` : '')}
  ${(summary.medium   ? `<span class="badge" style="background:${SEVERITY_COLORS.medium}">Medium: ${summary.medium}</span>` : '')}
  ${(summary.low      ? `<span class="badge" style="background:${SEVERITY_COLORS.low}">Low: ${summary.low}</span>` : '')}
  <span class="badge" style="background:#888">Total: ${summary.total}</span>
</div>
<table>
  <thead><tr><th>Severity</th><th>Vulnerability</th><th>Affected Versions</th><th>Recommendation</th></tr></thead>
  <tbody>${rows}
  </tbody>
</table>
<p style="margin-top:2rem;color:#888;font-size:0.9em">Report generated by DepGuard for VS Code · https://github.com/lm203688/depguard-lx</p>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  runScan, saveResults, clearResults, getLastResults,
  renderHtmlReport,
  SEVERITY_COLORS,
};
