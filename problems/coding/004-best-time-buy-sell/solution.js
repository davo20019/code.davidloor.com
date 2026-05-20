function maxProfit(prices) {
  let best = 0, lo = Infinity;
  for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); }
  return best;
}
