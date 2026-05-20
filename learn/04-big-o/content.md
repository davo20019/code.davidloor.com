# Big-O & Complexity

Every interview asks "what's the time and space complexity?" The honest answer is usually a few words, but you need to be able to defend them — and notice the hidden costs that beginners miss. This guide is the floor.

## What Big-O actually means

Big-O describes how the runtime (or memory) of an algorithm *scales* as the input grows. It's about growth rate, not stopwatch time.

We care about the dominant term and ignore constants:

- `5n + 3` → **O(n)**
- `2n² + 100n + 9` → **O(n²)** (the `n²` term dominates as `n` grows)
- `O(2n)` is the same as `O(n)` — drop the constant.

You're rating algorithms on the curve they trace, not on the speed of any particular run.

## The seven classes you'll meet

In order from best (slowest growth) to worst:

| Class | Name | Example |
|---|---|---|
| **O(1)** | constant | dict lookup, array indexing, push/pop on a stack |
| **O(log n)** | logarithmic | binary search, balanced-tree operations |
| **O(n)** | linear | one pass over a list |
| **O(n log n)** | linearithmic | comparison-based sorting (`sort()`, `Array.sort`) |
| **O(n²)** | quadratic | nested loops over the same array; brute-force pair search |
| **O(2ⁿ)** | exponential | recursive Fibonacci without memoization; subset enumeration |
| **O(n!)** | factorial | enumerating permutations |

A rough sense of scale. With `n = 10⁶` and a tight inner loop:

- O(n) — under a second.
- O(n log n) — a few seconds.
- O(n²) — minutes to hours. Won't pass for `n` past about 10⁴.
- O(2ⁿ) — heat death of the universe. Won't pass for `n` past about 25.

Interview problems are usually sized so that the **intended solution finishes in O(n) or O(n log n).** If your first idea is O(n²), look for a better one — almost always there is one.

## Reading complexity from code

### Sequential operations add

```python
xs.sort()                      # O(n log n)
for v in xs:                   # O(n)
    ...
# Total: O(n log n) + O(n) = O(n log n) — the bigger term wins.
```

### Nested loops multiply

```python
for i in range(n):
    for j in range(n):
        ...                    # O(n × n) = O(n²)
```

But watch out — *the inner loop's bound matters*:

```python
for i in range(n):
    for j in range(i):         # the inner loop runs i times, not n
        ...
# Total: 0 + 1 + 2 + … + (n-1) = n(n-1)/2 = O(n²) — still quadratic.
```

### Halving the problem each step

```python
while n > 0:
    n //= 2                    # halves each iteration → log₂(n) iterations → O(log n)
```

Binary search is the canonical example.

### Recursion: count the calls and the work per call

```python
def f(n):
    if n <= 1: return 1
    return f(n - 1) + f(n - 1)
# Each call spawns 2 — tree of depth n → 2ⁿ calls → O(2ⁿ).
```

```python
def f(n):
    if n <= 1: return 1
    return f(n // 2) + f(n // 2)
# Each call spawns 2 BUT they're on n/2.
# Total work: 1 + 2 + 4 + … + n = O(n) calls.
# Recursion depth: O(log n).
```

The shape of the recursion tree is what you analyze — width and depth.

## Space complexity

Time isn't the only thing. Space matters for:

- **In-place vs not.** Modifying input is O(1) extra space. Building a new array is O(n).
- **Recursion stack.** Each recursive call adds a frame. Tree DFS uses O(h) where h is the height.
- **Auxiliary structures.** A hash map of seen values is O(n).

```python
# Reverse a list — in place.
def reverse(xs):
    i, j = 0, len(xs) - 1
    while i < j:
        xs[i], xs[j] = xs[j], xs[i]
        i += 1; j -= 1
# Time O(n), space O(1).
```

```python
# Reverse a list — new array.
def reverse(xs):
    return xs[::-1]
# Time O(n), space O(n).
```

Both produce the same result. The space difference is real and matters for very large inputs.

## What's "amortized"?

You'll hear "amortized O(1)" for things like `list.append` (Python) and `Array.push` (JS).

A single push usually copies one element into the slot — O(1). Occasionally the underlying array is full and needs to double in size — that single push is O(n). But these "expensive" pushes happen rarely enough that *averaged over many pushes*, the cost is O(1) per push.

Practical takeaway: treat `append`/`push` as O(1) in your analysis. You can mention "amortized" if pressed.

## Hash maps — also "average case O(1)"

`dict.get`, `Map.get`, `Set.has`, `in` on a `set` — all average O(1). They become O(n) in pathological cases (adversarial hash collisions). In an interview, calling them O(1) is correct.

But "average O(1)" still has a constant factor that's larger than array indexing. For inner-loop hot paths on tiny data, an array can be faster in absolute terms. For interview problems the difference doesn't matter.

## The hidden costs that surprise people

### Python `list.pop(0)` is O(n)

```python
q = [1, 2, 3, 4, 5]
q.pop(0)            # ← O(n) — shifts every other element left.
```

If you write BFS using a Python `list` and `.pop(0)` for the dequeue, the BFS is silently O(n²). **Always use `collections.deque` for queues.**

### Python string concatenation in a loop

```python
s = ""
for word in words:
    s += word        # ← each += copies the entire growing string. O(total²).
```

Build with a list and join: `s = "".join(words)`. That's O(total).

### JavaScript `Array.shift()` is O(n)

```js
const q = [1, 2, 3, 4, 5];
q.shift();          // ← O(n) — same shifting cost as Python's pop(0).
```

Same fix: don't shift in a loop. Either keep an index pointer, or use the two-stack queue trick from the JavaScript Foundations guide.

### Spreading a giant array into a function

```js
Math.max(...someBigArray);   // ← passes every element as an argument.
                              // For very large arrays (millions of elements)
                              // this can hit the engine's argument limit.
                              // Use a loop or reduce() for huge inputs.
```

For interview-sized inputs, fine. For production code on massive arrays, prefer `someBigArray.reduce((m, v) => Math.max(m, v), -Infinity)`.

### `array.includes` and `array.indexOf` are O(n)

```js
if (xs.includes(v)) ...       // ← O(n) scan, every time.
```

If you'll do this many times, convert once to a `Set` and use `Set.has` (O(1)).

### Recursion depth in Python

Python's default recursion limit is around 1000 frames. For trees up to a few thousand nodes you're fine. For deep linked lists (n up to 10⁴), an iterative solution avoids the stack overflow.

You can raise the limit (`sys.setrecursionlimit(...)`) but converting to iteration is usually the right answer.

## Putting it together: analyzing a real solution

Take Trapping Rain Water:

```python
def trap(h):
    n = len(h)
    l = [0] * n; r = [0] * n            # O(n) space
    for i in range(1, n):                # O(n) time
        l[i] = max(l[i-1], h[i-1])
    for i in range(n - 2, -1, -1):       # O(n) time
        r[i] = max(r[i+1], h[i+1])
    best = 0
    for i in range(n):                   # O(n) time
        best += max(0, min(l[i], r[i]) - h[i])
    return best
```

Three sequential O(n) loops, two O(n) arrays. **O(n) time, O(n) space.**

There's also an O(n) time, O(1) space version using two pointers — same Big-O for time, better for space. In an interview, after writing the first version, you'd mention the trade-off and either offer the two-pointer one or note that you know it exists.

## What to say in an interview

A complete complexity answer has four parts:

1. **State the time complexity** ("O(n)").
2. **State the space complexity** ("O(n) auxiliary, plus the recursion stack which is O(log n) for a balanced tree").
3. **Justify it briefly** ("I make one pass over the input, and the hash map I build can hold up to n entries").
4. **Mention trade-offs** if a better one exists ("I'm trading O(n) space for an O(n²) → O(n) speedup; a two-pointer version would get back to O(1) space at the same time complexity").

That's the level interviewers expect. Anything terser sounds rote; anything longer is over-explaining.

## Quick reference card

| Operation | Python | JavaScript |
|---|---|---|
| Append / push (end) | `list.append` — O(1) amortized | `Array.push` — O(1) amortized |
| Pop end | `list.pop()` — O(1) | `Array.pop()` — O(1) |
| Insert / pop at start | `list.insert(0)` / `pop(0)` — **O(n)** | `Array.unshift` / `shift` — **O(n)** |
| Hash lookup | `d[k]` / `k in d` — O(1) avg | `Map.get` / `has` — O(1) avg |
| Set membership | `v in s` — O(1) avg | `Set.has(v)` — O(1) avg |
| Sort | `sorted()` / `.sort()` — O(n log n) | `Array.sort` — O(n log n) |
| Slice (copy a range) | `xs[i:j]` — O(j - i) | `xs.slice(i, j)` — O(j - i) |
| Reverse (new) | `xs[::-1]` — O(n) | `[...xs].reverse()` — O(n) |
| Membership in array | `v in xs` — **O(n)** | `xs.includes(v)` — **O(n)** |
| Queue dequeue (proper) | `deque.popleft()` — O(1) | manual / two-stack — O(1) amortized |
| Heap push/pop | `heapq.heappush/pop` — O(log n) | (no built-in) |

Bolded entries are the common O(n) traps that beginners use without realizing.
