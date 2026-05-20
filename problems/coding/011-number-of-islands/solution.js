function numIslands(grid) {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length; const seen = new Set(); let count = 0;
  const dfs = (r, c) => {
    const k = `${r},${c}`;
    if (seen.has(k) || r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    seen.add(k); dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    if (grid[r][c] === "1" && !seen.has(`${r},${c}`)) { count++; dfs(r, c); }
  return count;
}
