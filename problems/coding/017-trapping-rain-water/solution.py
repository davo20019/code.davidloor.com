def trap(h):
    n = len(h); l = [0]*n; r = [0]*n; best = 0
    for i in range(1, n): l[i] = max(l[i-1], h[i-1])
    for i in range(n-2, -1, -1): r[i] = max(r[i+1], h[i+1])
    for i in range(n): best += max(0, min(l[i], r[i]) - h[i])
    return best
