function canFinish(n, prereqs) {
  const g = Array.from({length: n}, () => []); const indeg = Array(n).fill(0);
  for (const [a, b] of prereqs) { g[b].push(a); indeg[a]++; }
  const q = []; for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  let seen = 0;
  while (q.length) { const v = q.shift(); seen++; for (const w of g[v]) if (--indeg[w] === 0) q.push(w); }
  return seen === n;
}
