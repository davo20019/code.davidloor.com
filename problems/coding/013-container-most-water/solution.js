function maxArea(h) {
  let i = 0, j = h.length - 1, best = 0;
  while (i < j) { best = Math.max(best, (j - i) * Math.min(h[i], h[j])); if (h[i] < h[j]) i++; else j--; }
  return best;
}
