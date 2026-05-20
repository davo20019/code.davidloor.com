def lengthOfLongestSubstring(s):
    seen = {}; best = 0; left = 0
    for i, c in enumerate(s):
        if c in seen and seen[c] >= left: left = seen[c] + 1
        seen[c] = i; best = max(best, i - left + 1)
    return best
