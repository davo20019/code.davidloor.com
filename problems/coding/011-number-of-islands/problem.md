# Number of Islands

Given an `m x n` 2D grid of characters `"1"` (land) and `"0"` (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically. You may assume all four edges of the grid are surrounded by water.

## Example

Input:
```
grid = [
  ["1","1","0"],
  ["1","0","0"],
  ["0","0","1"]
]
```
Output: `2`

Input:
```
grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
```
Output: `1`

## Constraints
- `m == grid.length`, `n == grid[i].length`
- 1 ≤ m, n ≤ 300
- `grid[i][j]` is `"0"` or `"1"` (string characters, not integers).
