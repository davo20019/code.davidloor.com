function groupAnagrams(strs) {
  const g = new Map();
  for (const s of strs) {
    const k = [...s].sort().join('');
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(s);
  }
  return [...g.values()];
}
