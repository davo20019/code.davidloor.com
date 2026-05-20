def groupAnagrams(strs):
    g = {}
    for s in strs:
        k = "".join(sorted(s))
        g.setdefault(k, []).append(s)
    return list(g.values())
