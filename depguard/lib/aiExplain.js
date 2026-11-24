'use strict';

/**
 * AI fix explanation module (Phase 2 - Pro only).
 * Currently a stub; implementation requires user-provided API key.
 * All public functions are safe no-ops when called without a key.
 */

const PROVIDER_URLS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
};

/**
 * Request an AI-generated fix explanation for a single CVE.
 * Returns human-readable markdown string, or undefined on failure / no key.
 *
 * @param {string} apiKey     - User's API key (stored locally only, per privacy policy)
 * @param {string} provider   - 'openai' | 'claude' | 'gemini'
 * @param {object} vuln       - Vulnerability object from scan results
 * @returns {Promise<string|undefined>}
 */
async function explainFix(apiKey, provider, vuln) {
  if (!apiKey || !vuln) return undefined;
  const url = PROVIDER_URLS[provider];
  if (!url) return undefined;

  const systemPrompt = `You are a security expert helping developers fix vulnerabilities. Give a concise, actionable fix recommendation in plain English. Max 3 sentences.`;
  const userPrompt = `Vulnerability: ${vuln.title || vuln.id}\nSeverity: ${vuln.severity}\nAffected: ${vuln.affectedVersions || 'unknown'}\nAdvisory: ${vuln.url || 'N/A'}\nCurrent recommendation: ${vuln.recommendation || 'Check advisory URL'}`;

  try {
    let body, headers;
    if (provider === 'openai') {
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = JSON.stringify({ model: 'gpt-4o-mini', messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ], max_tokens: 200 });
    } else if (provider === 'claude') {
      headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
      body = JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 200, messages: [
        { role: 'user', content: userPrompt },
      ]});
    } else if (provider === 'gemini') {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }], generationConfig: { maxOutputTokens: 200 } });
    } else {
      return undefined;
    }

    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) return undefined;
    const json = await res.json();

    if (provider === 'openai') return json.choices?.[0]?.message?.content;
    if (provider === 'claude')  return json.content?.[0]?.text;
    if (provider === 'gemini') return json.candidates?.[0]?.content?.parts?.[0]?.text;
    return undefined;
  } catch (_) {
    return undefined;
  }
}

/**
 * Batch-explain multiple vulnerabilities (for Phase 2 MCP tool).
 * Returns array of { id, explanation }.
 */
async function explainBatch(apiKey, provider, vulnerabilities) {
  if (!apiKey || !Array.isArray(vulnerabilities)) return [];
  const results = [];
  for (const v of vulnerabilities.slice(0, 10)) {  // rate-limit: max 10 at a time
    const exp = await explainFix(apiKey, provider, v);
    results.push({ id: v.id || v.title, explanation: exp || null });
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

module.exports = { explainFix, explainBatch };
