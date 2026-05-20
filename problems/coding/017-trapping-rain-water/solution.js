function trap(h) {
  const n = h.length; const l = Array(n).fill(0), r = Array(n).fill(0);
  for (let i = 1; i < n; i++) l[i] = Math.max(l[i-1], h[i-1]);
  for (let i = n-2; i >= 0; i--) r[i] = Math.max(r[i+1], h[i+1]);
  let best = 0;
  for (let i = 0; i < n; i++) best += Math.max(0, Math.min(l[i], r[i]) - h[i]);
  return best;
}
