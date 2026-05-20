def numIslands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0]); seen = set(); count = 0
    def dfs(r, c):
        if (r, c) in seen or r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1": return
        seen.add((r, c))
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1; dfs(r, c)
    return count
