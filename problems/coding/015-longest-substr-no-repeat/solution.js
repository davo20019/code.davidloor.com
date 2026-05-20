function lengthOfLongestSubstring(s) {
  const seen = new Map(); let best = 0, left = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (seen.has(c) && seen.get(c) >= left) left = seen.get(c) + 1;
    seen.set(c, i); best = Math.max(best, i - left + 1);
  }
  return best;
}
