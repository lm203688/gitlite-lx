/**
 * GitLite — lib/blame.js
 *
 * Shared utilities for blame data grouping.
 */

/**
 * Group consecutive entries by condition function.
 * e.g. group consecutive same-author lines for decoration merging.
 */
function groupConsecutive(entries, sameGroup) {
  if (entries.length === 0) return [];
  const groups = [[entries[0]]];
  for (let i = 1; i < entries.length; i++) {
    const prev = groups[groups.length - 1];
    if (sameGroup(prev[prev.length - 1], entries[i])) {
      prev.push(entries[i]);
    } else {
      groups.push([entries[i]]);
    }
  }
  return groups;
}

module.exports = { groupConsecutive };
