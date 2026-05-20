# Python Foundations

Python is the most popular interview language because it reads like pseudocode. The trade-off: it has a small set of opinionated idioms that, once you learn them, you must reach for. Writing Python that *looks* like C++ marks you as someone who doesn't know Python. This guide is the floor.

## The four data structures you'll use every day

```python
xs = [1, 2, 3]            # list  — ordered, mutable, allows duplicates
d  = {"a": 1, "b": 2}     # dict  — hash map, O(1) lookup by key
s  = {1, 2, 3}             # set   — unordered, unique, O(1) membership
t  = (3, 4)                # tuple — immutable, hashable (usable as dict key)
```

### Why hashable matters

If you want to track visited cells in a grid:

```python
seen = set()
for r in range(rows):
    for c in range(cols):
        if (r, c) in seen:
            continue
        seen.add((r, c))
```

The tuple `(r, c)` is hashable. A list `[r, c]` is **not** — `set()` would refuse it. This is one of the most common mistakes in early Python.

## List, the workhorse

```python
xs = [1, 2, 3]
xs.append(4)       # → [1, 2, 3, 4]   O(1)
xs.pop()           # returns 4         O(1)
xs.insert(0, 9)    # → [9, 1, 2, 3]   O(n) — avoid in tight loops
xs.pop(0)          # → 9              O(n) — same warning

xs[1:3]            # slice — new list  [2, 3]
xs[::-1]           # reversed — new list
xs[::2]            # every second element

len(xs)            # length
sum(xs)            # total
max(xs); min(xs)
```

### List comprehensions (memorize the shape)

```python
[v * 2 for v in xs]                       # transform
[v for v in xs if v > 0]                  # filter
[(i, v) for i, v in enumerate(xs)]         # both
{v for v in xs}                            # set comprehension
{v: v * 2 for v in xs}                     # dict comprehension
```

They're not just shorter — they're meaningfully faster than a for-loop with `.append`. Reach for them.

## dict, the second workhorse

```python
d = {}
d["k"] = 1
d.get("missing", 0)            # safe lookup with default
d.setdefault("k", []).append(9) # in-place build-up

if "k" in d:                    # O(1) membership
    ...

for k in d:               # iterate keys
    ...
for v in d.values():      # iterate values
for k, v in d.items():    # iterate pairs
```

**The Two Sum move** — every coding interviewer has seen this and the expectation is that you can write it in 30 seconds:

```python
def two_sum(nums, target):
    seen = {}                    # value → index
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
```

This is the idiom: **store as you go, look up what you need.** It comes up in dozens of problems.

## `collections` — the cheat code

Three classes you should know cold.

### `defaultdict` — auto-initialized values

```python
from collections import defaultdict

groups = defaultdict(list)              # missing keys auto-create []
for word in words:
    key = "".join(sorted(word))         # canonical form of an anagram
    groups[key].append(word)
return list(groups.values())
```

Without `defaultdict` you'd write `groups.setdefault(key, []).append(word)`. `defaultdict` is shorter and cleaner.

### `Counter` — multiset

```python
from collections import Counter

Counter("anagram")                       # → Counter({'a': 3, 'n': 1, 'g': 1, 'r': 1, 'm': 1})
Counter("anagram") == Counter("nagaram") # → True   one-line anagram check

c = Counter()
c[word] += 1                             # count things in a loop
c.most_common(3)                         # top 3 by count
```

### `deque` — double-ended queue (for BFS)

```python
from collections import deque

q = deque([root])
while q:
    node = q.popleft()                   # O(1) — vs list.pop(0) which is O(n)
    for nb in neighbors(node):
        q.append(nb)
```

If you use a `list` and call `.pop(0)` in a BFS, the algorithm is silently O(n²). `deque` makes it O(n). Always reach for `deque` in BFS.

## `heapq` — min-heap, no syntactic sugar

Python's heap is a *function library* over a list, not a class. It works but the API is awkward.

```python
import heapq

heap = []
heapq.heappush(heap, 5)        # push
heapq.heappop(heap)             # pop smallest

# Top-k pattern: keep a min-heap of size k.
import heapq
def top_k(nums, k):
    h = []
    for v in nums:
        heapq.heappush(h, v)
        if len(h) > k:
            heapq.heappop(h)
    return h

# Max-heap? Push the negative.
heapq.heappush(heap, -value)
-heapq.heappop(heap)
```

## Iteration idioms

```python
for i, v in enumerate(nums):        # index + value
for a, b in zip(xs, ys):            # parallel pairs
for k, v in d.items():              # dict pairs
for v in reversed(xs):              # reverse without copying
range(n)                            # 0 .. n-1
range(start, stop, step)            # arithmetic sequence
range(n - 1, -1, -1)                # countdown from n-1 to 0
```

Indexing a list `xs[i]` is what you do when you have to. Iterating with `enumerate` is what you do when you can.

## Sorting

```python
sorted(xs)                          # new list, ascending
xs.sort()                           # in place
sorted(xs, reverse=True)            # descending
sorted(xs, key=lambda x: x[1])      # by 2nd element of each tuple
sorted(xs, key=len)                 # by length

# Stable sort: equal keys preserve input order. Useful.
```

Sort is O(n log n). Two-pointer or sliding-window solutions often start with a sort.

## Strings

Strings are sequences of characters. Most list operations work.

```python
s = "anagram"
s[0]                # 'a'
s[1:4]              # 'nag'
s[::-1]             # 'margana'  — reverse
list(s)             # ['a', 'n', 'a', 'g', 'r', 'a', 'm']
sorted(s)           # ['a', 'a', 'a', 'g', 'm', 'n', 'r']
"".join(sorted(s))  # 'aaagmnr'  — canonical anagram form

s.split(" ")        # split into list
" ".join(parts)     # join list with separator
s.lower(); s.upper()
s.strip()
"abc" in s          # substring test, O(n*m)

ord('a')            # 97   — character to int
chr(97)             # 'a'  — int to character
```

Strings are immutable. `s[0] = "x"` is an error. Build with a list and `"".join()` at the end if you're modifying.

## Truthiness — the trap

```python
if not nums:           # True when nums == [] or nums is None
if d:                   # True when d has any keys
if x:                   # True when x is non-zero AND not None AND not empty
```

Two real interview bugs:

```python
if not nums.pop():     # WRONG — pops a 0 and acts like "empty"
                       # Use `if nums and nums[-1] == 0:` instead.

if x == 0:             # if x might be None, write `if x is not None and x == 0`.
```

Be deliberate about `None`, `0`, and empty containers — they're all falsy but different.

## Functions

```python
def f(x, y=10):                # y has a default
    return x + y

def g(*args, **kwargs):        # variadic
    pass

square = lambda x: x * x       # one-liner; useful as `key=` to sort
```

**The default-argument trap:**

```python
def f(xs=[]):              # WRONG — the [] is shared across calls.
    xs.append(1)
    return xs

f()  # [1]
f()  # [1, 1]  ← surprise
```

Use `xs=None` and `if xs is None: xs = []` inside the function.

## Classes (when you need them)

For problems involving linked lists or trees:

```python
class ListNode:
    def __init__(self, val=0, nxt=None):
        self.val = val
        self.next = nxt

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

On this site the harness injects these classes for you, so you can just write `cur.next = ListNode(v)` in your solution.

## Recursion vs iteration

Python's default recursion limit is ~1000. For tree traversals on interview-sized inputs that's fine. For deep linked lists (n = 10⁴), prefer iteration:

```python
# Reverse a linked list — iterative.
def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

Three variables (`prev`, `cur`, `nxt`), three lines of swap. Memorize the pattern.

## The Python you can skip (for this problem set)

- Generators (`yield`)
- Context managers (`with` blocks beyond simple file I/O)
- Decorators
- `*args` / `**kwargs` in your own functions
- Type hints (legal but not required)
- Async / threading
- Regex

These are real Python. None of them appear in the v1 problem set. Learn them after you can solve all 20 problems comfortably.

## Tour-of-the-problems map

| Problem | Python tool that solves it |
|---|---|
| Two Sum | `dict` lookup |
| Valid Parentheses | `list` as stack |
| Merge Two Sorted Lists | dummy `ListNode`, three-pointer dance |
| Valid Anagram | `Counter` or `sorted()` |
| Group Anagrams | `defaultdict(list)` keyed by sorted form |
| Maximum Subarray | one running variable each (Kadane) |
| Binary Search | `lo`, `hi`, `mid`; integer division `//` |
| Number of Islands | `set()` of `(r, c)` tuples; DFS recursion |
| 3Sum | `nums.sort()` then two-pointer per `i` |
| Longest Substring No Repeat | `dict` of char → last index; window |
| Trapping Rain Water | left/right max arrays, single pass |
| Word Break | `set(words)`; 1D DP array |
| Course Schedule | `defaultdict(list)` graph + `deque` for BFS topo sort |
| LCA of BST | compare `p` and `q` to `root.val`; no recursion needed |

Once these tools feel automatic, the problems become exercises in *which one to pick*, not *how to write code*.
