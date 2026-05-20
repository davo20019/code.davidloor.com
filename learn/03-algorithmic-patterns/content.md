# Algorithmic Patterns

Interview problems look infinite but live inside a small number of patterns. Once you've internalized these ten, the work of solving a new problem becomes the work of *recognizing which pattern fits the input shape*. The code follows.

Every pattern below is shown with: when to recognize it, a code template, the time and space cost, and which problem in the v1 set uses it.

## 1. Hash map for O(1) lookups

**Recognize it:** the problem asks you to find pairs, counts, groups, or "have I seen this before?" — and brute force would be O(n²) checking every pair.

The move: trade space for time. Build a dictionary as you go; look up what you need.

```python
# Two Sum
def twoSum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
```

```js
// Same idea in JS
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}
```

**Cost:** O(n) time, O(n) space.
**In the set:** Two Sum, Valid Anagram, Group Anagrams, Word Break, Longest Substring Without Repeating.

## 2. Two pointers

**Recognize it:** sorted input, looking for a pair / triplet / window with a target property, *or* you need to traverse from both ends.

Two indices move toward each other (or in the same direction). At each step you make a decision: shrink which side?

```python
# Container With Most Water — sorted by index, not value, but same shape.
def maxArea(heights):
    i, j, best = 0, len(heights) - 1, 0
    while i < j:
        best = max(best, (j - i) * min(heights[i], heights[j]))
        if heights[i] < heights[j]:
            i += 1
        else:
            j -= 1
    return best
```

**3Sum** is two-pointer wrapped in an outer loop:

```python
def threeSum(nums):
    nums.sort()                          # O(n log n)
    res = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                      # skip duplicate anchor
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]: l += 1
                while l < r and nums[r] == nums[r - 1]: r -= 1
                l += 1; r -= 1
            elif s < 0:
                l += 1
            else:
                r -= 1
    return res
```

**Cost:** O(n) for one pass; O(n²) when wrapped in an outer loop.
**In the set:** Container With Most Water, 3Sum, Trapping Rain Water.

## 3. Sliding window

**Recognize it:** "longest / shortest / count of subarrays or substrings satisfying X." The answer is a *contiguous* slice of the input.

Two indices (`left`, `right`) define a window. You advance `right`, expanding. When the window breaks a constraint, you advance `left` until it holds again. Track the best window seen.

```python
def lengthOfLongestSubstring(s):
    last_seen = {}            # char → most recent index
    left = best = 0
    for right, c in enumerate(s):
        if c in last_seen and last_seen[c] >= left:
            left = last_seen[c] + 1     # jump left past the duplicate
        last_seen[c] = right
        best = max(best, right - left + 1)
    return best
```

The key insight: `left` only ever moves right. Both pointers cross the array at most once → O(n).

**Cost:** O(n) time, O(k) space (k = alphabet size).
**In the set:** Longest Substring Without Repeating Characters.

## 4. Fast and slow pointers

**Recognize it:** cycle detection in a linked list, or finding "middle of" something in one pass.

Two pointers move at different speeds. Distance between them grows linearly. If the structure cycles, they collide; if not, the fast one runs off the end first.

```python
def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

This is **Floyd's Tortoise and Hare algorithm.** Worth knowing by name.

**Cost:** O(n) time, O(1) space.
**In the set:** Linked List Cycle.

## 5. Binary search

**Recognize it:** the input is *sorted* (or *monotonic by some property*), and you need to find a value or a boundary.

```python
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

**Two off-by-one rules to memorize:**
- `lo <= hi` with `lo = mid + 1` / `hi = mid - 1` — for exact-match search. Loop terminates when `lo > hi`.
- `lo < hi` with `lo = mid + 1` / `hi = mid` — for "find boundary." Loop terminates when `lo == hi`.

Pick one form and stick to it. Mixing them is the #1 source of binary-search bugs.

**Rotated arrays** (Search in Rotated Sorted Array) extend this with one extra branch: at each step, decide which half is sorted, then check whether the target is in that sorted half.

**Cost:** O(log n) time, O(1) space.
**In the set:** Binary Search, Search in Rotated Sorted Array.

## 6. Linked-list pointer manipulation

**Recognize it:** any problem involving `head` and `node.next`.

Two techniques cover most of it:

### Dummy head — eliminates first-node edge cases

```python
def mergeTwoLists(l1, l2):
    dummy = ListNode(0)
    cur = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            cur.next = l1; l1 = l1.next
        else:
            cur.next = l2; l2 = l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next
```

Without the dummy, you'd need an `if` branch for "what if the result is empty so far." With it, every iteration looks the same.

### Three-pointer reverse — the canonical pattern

```python
def reverseList(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

Memorize the three lines: save `next`, rewire to `prev`, advance both. This is *the* linked-list pattern. Variants appear in many problems.

**Cost:** O(n) time, O(1) space.
**In the set:** Merge Two Sorted Lists, Reverse Linked List.

## 7. BFS / DFS on a grid

**Recognize it:** input is a 2D grid; you're counting/finding connected regions or shortest paths.

The structure: pick an unvisited starting cell, *flood* outward to all reachable cells, mark them visited. Increment a count for each new flood.

```python
def numIslands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = set()
    count = 0

    def dfs(r, c):
        if (r, c) in seen or r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        seen.add((r, c))
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1
                dfs(r, c)
    return count
```

**DFS** (above) is shorter when you only need "is it connected" or "how many components." **BFS** (queue-based) is what you need when you also want *shortest path* — counting levels from the start.

**Cost:** O(rows × cols) time and space.
**In the set:** Number of Islands.

## 8. Tree traversal

**Recognize it:** input is a tree (binary, BST). You want to compute a single value (depth, sum, LCA), find a node, or visit every node.

**Key shortcut for BSTs:** the tree is sorted in-order. For comparisons and lookups you almost never need full DFS — just descend left or right based on the comparison.

```python
# Lowest Common Ancestor in a BST.
def lowestCommonAncestor(root, p, q):
    while root:
        if p < root.val and q < root.val:
            root = root.left
        elif p > root.val and q > root.val:
            root = root.right
        else:
            return root.val
    return -1
```

For non-BST trees, you usually need recursion (DFS) or a queue (BFS):

```python
# Generic DFS template
def dfs(node):
    if not node:
        return base_case
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(node.val, left, right)
```

**Cost:** O(n) time worst case (n nodes); O(h) recursion stack (h = tree height). For balanced trees h = log n; for a degenerate "linked list" tree h = n.
**In the set:** Lowest Common Ancestor of a BST.

## 9. Dynamic programming (1D)

**Recognize it:** you can break the problem into subproblems whose answers compose, and subproblems repeat. Or — the recursive solution is exponential because it revisits the same arguments.

The shape is always the same:

1. Define `dp[i]` in plain English. ("The best subarray sum ending at index i." "True if s[0..i] can be segmented.")
2. Write a recurrence: how does `dp[i]` depend on earlier `dp[j]`?
3. Write base cases.
4. Fill the array.

```python
# Maximum Subarray — Kadane's algorithm.
# dp[i] = max subarray sum ending at index i
#       = max(nums[i], dp[i-1] + nums[i])
def maxSubArray(nums):
    best = cur = nums[0]
    for v in nums[1:]:
        cur = max(v, cur + v)
        best = max(best, cur)
    return best
```

```python
# Climbing Stairs — the Fibonacci recurrence in disguise.
# dp[i] = dp[i-1] + dp[i-2]
def climbStairs(n):
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

```python
# Word Break.
# dp[i] = True if s[0..i] can be segmented using words from the dictionary.
def wordBreak(s, words):
    words = set(words)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]
```

**Optimization:** many 1D DPs only depend on the last one or two entries. You can replace `dp[]` with two rolling variables — Kadane and Climbing Stairs above already do this.

**Cost:** O(n) to O(n²) time depending on how many earlier states the recurrence consults.
**In the set:** Maximum Subarray, Climbing Stairs, Word Break, Trapping Rain Water.

## 10. Topological sort

**Recognize it:** input is a DAG of dependencies ("X requires Y"). You need a valid order, or to detect whether one exists.

**Kahn's algorithm** (BFS-based) is the easiest to write:

```python
from collections import defaultdict, deque

def canFinish(n, prereqs):
    g = defaultdict(list)
    indeg = [0] * n
    for a, b in prereqs:
        g[b].append(a)
        indeg[a] += 1

    q = deque([i for i in range(n) if indeg[i] == 0])
    seen = 0
    while q:
        v = q.popleft()
        seen += 1
        for w in g[v]:
            indeg[w] -= 1
            if indeg[w] == 0:
                q.append(w)
    return seen == n
```

The key idea: a node can be scheduled when all its prerequisites are done. Push 0-indegree nodes; pop and decrement neighbors; push when their indegree hits 0. If you process fewer than `n` total nodes, the graph has a cycle.

**Cost:** O(V + E) time and space.
**In the set:** Course Schedule.

## How to recognize the pattern from the prompt

A reliable heuristic — read the prompt, then check this table:

| The prompt says... | Reach for... |
|---|---|
| "find two numbers that sum to" | Hash map (Pattern 1) |
| "longest / shortest substring or subarray" | Sliding window (Pattern 3) |
| "given a sorted array" | Two pointers (Pattern 2) or binary search (Pattern 5) |
| "find a pair / triplet" with sorted input | Sort + two pointers (Pattern 2) |
| "linked list has a cycle / find the middle" | Fast/slow (Pattern 4) |
| "binary tree / BST" | Tree traversal (Pattern 8) |
| "grid / matrix / 2D" with "regions" or "shortest path" | BFS/DFS (Pattern 7) |
| "smallest / largest / count of X over choices" | DP (Pattern 9) |
| "build order / dependencies / prerequisites" | Topological sort (Pattern 10) |
| "stack-like structure: brackets, undo, history" | Stack — `list` in Python, `Array` in JS |

If the prompt doesn't fit any of these, the safest first move is usually **sort the input and look for monotonic structure** — that unlocks two pointers or binary search.

## After this guide

You've now seen every algorithmic shape needed for the v1 problem set. The remaining work is *reps*. The skill you're training isn't memorizing solutions — it's:

1. **Reading a prompt and naming the pattern within 60 seconds.**
2. **Writing the template from memory** without looking it up.
3. **Adapting** the template to the problem's specifics.

The problems on this site are designed for this. Solve each one twice — once in Python, once in JavaScript — and these patterns will stop being knowledge and start being muscle memory.
