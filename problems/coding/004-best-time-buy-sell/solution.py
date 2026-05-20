def maxProfit(prices):
    best, lo = 0, float('inf')
    for p in prices:
        lo = min(lo, p); best = max(best, p - lo)
    return best
