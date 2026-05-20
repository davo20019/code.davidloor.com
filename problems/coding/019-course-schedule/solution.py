def canFinish(n, prereqs):
    from collections import defaultdict, deque
    g = defaultdict(list); indeg = [0]*n
    for a, b in prereqs:
        g[b].append(a); indeg[a] += 1
    q = deque([i for i in range(n) if indeg[i] == 0]); seen = 0
    while q:
        v = q.popleft(); seen += 1
        for w in g[v]:
            indeg[w] -= 1
            if indeg[w] == 0: q.append(w)
    return seen == n
