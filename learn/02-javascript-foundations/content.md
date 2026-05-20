# JavaScript Foundations

Modern JavaScript (ES2015 and later) has a small, opinionated subset that handles every problem in the set. The harder thing about JS for interviews isn't the language — it's avoiding the rough edges (`var`, `==`, `Object` as a hash map, the default `sort`). This guide is the floor.

## Declarations: `const`, `let`, never `var`

```js
const x = 1;        // can't be reassigned
let y = 2;          // reassignable
y = 3;
var z = 4;          // legacy. Don't use.
```

`const` for everything that doesn't reassign — most things, in practice. `let` for loop counters and accumulators that change. `var` has function-scoped hoisting that bites you in unexpected ways and has no upside in modern code.

## Equality: `===`, never `==`

```js
1 === 1            // true
1 === "1"          // false   — same value, different type
1 ==  "1"          // true    — type coercion. Sometimes useful. Never necessary.
null === undefined // false
null ==  undefined // true
```

Use `===` everywhere. The one exception you'll see is `x == null` to test for "null or undefined together" — but `x === null || x === undefined` is clearer.

## Arrays: the workhorse

```js
const xs = [1, 2, 3];
xs.push(4);                // → [1, 2, 3, 4]   end ops are amortized O(1)
xs.pop();                  // returns 4
xs.unshift(0);             // → [0, 1, 2, 3]   start ops are O(n) — avoid in tight loops
xs.shift();                // returns 0

xs[0];                     // 1
xs.length;                 // 3
xs.includes(2);            // true   — O(n) scan
xs.indexOf(2);             // 1, or -1 if absent
```

### Slicing — copy without mutation

```js
xs.slice(1, 3);            // → [2, 3]   start inclusive, end exclusive
xs.slice();                // shallow copy of whole array
xs.slice(-2);              // last two elements

xs.splice(1, 2);           // MUTATES — removes 2 elements starting at index 1
                           // returns the removed slice
```

`slice` and `splice` look alike and behave nothing alike. `slice` is non-destructive (use it). `splice` mutates (use it deliberately).

### The methods that solve most things

```js
xs.map(v => v * 2);                       // → [2, 4, 6]
xs.filter(v => v > 1);                    // → [2, 3]
xs.reduce((acc, v) => acc + v, 0);        // → 6
xs.find(v => v > 1);                      // → 2 (first match) or undefined
xs.findIndex(v => v > 1);                 // → 1 or -1
xs.some(v => v < 0);                      // → false
xs.every(v => v > 0);                     // → true
xs.forEach((v, i) => console.log(i, v));  // no return — side effects only
```

All non-mutating except `forEach`. Chain freely: `nums.filter(v => v > 0).map(v => v * 2).reduce(...)`.

## The single biggest JavaScript interview trap: `Array.sort`

```js
[10, 2, 1].sort();                    // → [1, 10, 2]   ← LEXICOGRAPHIC
[10, 2, 1].sort((a, b) => a - b);     // → [1, 2, 10]   ← numeric
```

`Array.sort` converts elements to strings before comparing unless you pass a comparator. This is from ECMAScript-262, not a bug. **Always pass a comparator for numbers.**

```js
xs.sort((a, b) => a - b);              // ascending
xs.sort((a, b) => b - a);              // descending
words.sort((a, b) => a.length - b.length);     // by length
points.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // by x, then y
```

Knowing this saves you from at least one wrong answer in a real interview.

## `Map` and `Set` — use them, not `{}` and `[]`

Plain objects make terrible hash maps. They coerce keys to strings (`{}[1]` and `{}["1"]` are the same slot), inherit prototype properties (`__proto__` is a real footgun), and don't track size.

```js
const m = new Map();
m.set("k", 1);
m.set(42, "answer");
m.set(someObject, "value");      // any value as a key

m.get("k");                       // 1   (undefined if missing)
m.has("k");                       // true
m.delete("k");
m.size;                           // 1

for (const [k, v] of m) ...      // insertion order, guaranteed
```

```js
const s = new Set([1, 2, 3]);
s.add(4);
s.delete(1);
s.has(2);                         // O(1) average
s.size;
[...s];                           // → [2, 3, 4]   spread to array
```

Plain `{}` is fine for a *known fixed-shape record*. `Map` is for "hash table" — Two Sum, grouping, counting, frequency tables.

## Strings

```js
const s = "anagram";
s[0];                              // "a"
s.length;                          // 7
s.slice(1, 4);                     // "nag"
s.includes("nag");                 // true
s.indexOf("g");                    // 3
s.split("");                       // ["a","n","a","g","r","a","m"]
[..."abc"];                        // → ["a","b","c"]  spread also works
"abc".repeat(3);                   // "abcabcabc"

s.charCodeAt(0);                   // 97   character to int
String.fromCharCode(97);           // "a"  int to character
```

Strings are immutable. `s[0] = "x"` silently fails (or throws in strict mode). To "mutate" a string, build with a list and join:

```js
const chars = [..."hello"];
chars[0] = "H";
chars.join("");                    // "Hello"
```

To reverse: `[...s].reverse().join("")`. There's no built-in `s.reverse()`.

## `for...of`, `for...in`, and friends

```js
for (const v of nums)         ...   // ✔ values — use for arrays, sets, maps
for (const k of map.keys())   ...   // explicit keys
for (const [k, v] of map)     ...   // pairs
for (const [i, v] of nums.entries()) ...   // index + value (array entries returns this)

for (const k in obj)          ...   // KEYS of an OBJECT — and also inherited keys (yikes)
                                    // Use Object.keys/entries instead.

for (let i = 0; i < n; i++)   ...   // classic — when you need the index
```

Rule of thumb: `for...of` for arrays/Sets/Maps, `for(let i; ...)` when the index matters, and `Object.entries(obj)` when iterating plain objects.

## Destructuring and spread (every solution uses these)

```js
const [a, b, c] = [1, 2, 3];           // array destructuring
const { val, next } = node;            // object destructuring
const { val: nodeVal } = node;         // rename
const [head, ...tail] = nums;          // rest

const merged = [...arr1, ...arr2];
const copied = [...arr1];               // shallow copy
const max = Math.max(...nums);          // spread args

const updated = { ...obj, count: 5 };  // copy + override one field

function f(...args) { ... }            // accept variable args
```

## Functions: arrow vs regular

```js
const add = (a, b) => a + b;            // implicit return
const square = x => x * x;              // single-arg, no parens needed
const fn = () => { /* multi-line */ return 1; };

function regular(a, b) { return a + b; } // works the same, except for `this`
```

Use arrows for callbacks (`map`, `filter`, comparators). They don't have their own `this`, which is exactly what you want inside `.map(v => ...)`. The only time you want a regular `function` is when you specifically need a fresh `this` binding (rare in interview problems).

### Optional and nullish

```js
node?.next?.val                       // optional chaining — short-circuits on null/undefined
x ?? defaultValue                     // nullish coalescing — only null/undefined trigger
x || defaultValue                     // truthy-or — 0 and "" also trigger

const arr = list ?? [];               // common pattern when list might be null
```

## Math you'll actually use

```js
Math.max(a, b); Math.min(a, b);
Math.max(...nums);                    // spread an array
Math.floor(n / 2); Math.ceil(n / 2);
Math.abs(-5);                          // 5

(lo + hi) >> 1                         // integer midpoint, faster than Math.floor
                                       // works for non-negative ints in our range

Number.MAX_SAFE_INTEGER                // 2^53 - 1 — beyond this, ints lose precision
Number.MIN_SAFE_INTEGER

Infinity; -Infinity;                   // useful as initial best-so-far
```

**Number precision warning:** all JS numbers are 64-bit floats. `0.1 + 0.2 !== 0.3`. For interview-sized integer arithmetic you're fine; for problems involving very large integers or precise decimals, use `BigInt` (`10n ** 18n` syntax) — but no v1 problem here needs that.

## Classes (when you need them)

```js
class Node {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

const head = new Node(1, new Node(2));
```

Linked lists and trees in this site's harness use `ListNode` and `TreeNode` classes — your solution can just write `new ListNode(v)` directly; the harness injects the class globally.

## Queue / deque — JavaScript has none

There's no built-in double-ended queue. Three options:

```js
// 1. Just use an array. .shift() is O(n) but for problems with n ≤ 10^4
//    you usually don't notice. Simple and acceptable.
const q = [start];
while (q.length) {
  const node = q.shift();
  // ...
}

// 2. Index-based — never .shift(); track a head pointer.
const q = [start]; let head = 0;
while (head < q.length) {
  const node = q[head++];
  // ...
}
// Caveat: q never shrinks. Fine for one-pass BFS.

// 3. Two-stack trick — amortized O(1) on both ends.
class Queue {
  in = []; out = [];
  push(v)  { this.in.push(v); }
  shift()  {
    if (!this.out.length) while (this.in.length) this.out.push(this.in.pop());
    return this.out.pop();
  }
  get size() { return this.in.length + this.out.length; }
}
```

For the problems on this site, option 1 or 2 is fine.

## The JavaScript you can skip (for this problem set)

- `this`, `bind`, `call`, `apply`
- Prototype manipulation
- Generators, `yield`
- `Proxy`, `Reflect`, `Symbol`
- `WeakMap`, `WeakSet`
- Promises / async (no problem here is async)
- `eval`, `Function` constructor
- `var` and hoisting (just don't use `var`)
- Most of `Object` (`Object.freeze`, `Object.defineProperty`, etc.)

Real JavaScript. Not needed for any v1 problem here.

## Tour-of-the-problems map

| Problem | JavaScript tool that solves it |
|---|---|
| Two Sum | `Map` from value → index |
| Valid Parentheses | array as stack (`push` / `pop`) |
| Merge Two Sorted Lists | dummy `ListNode`, three-pointer dance |
| Valid Anagram | sort then join, or `Map` of char counts |
| Group Anagrams | `Map<string, string[]>` keyed by sorted form |
| Maximum Subarray | two running variables (Kadane) |
| Binary Search | `lo`, `hi`, `mid = (lo + hi) >> 1` |
| Number of Islands | `Set` of `${r},${c}` strings; recursive DFS |
| 3Sum | `[...nums].sort((a,b) => a-b)` then two-pointer per `i` |
| Longest Substring No Repeat | `Map` of char → last index; sliding window |
| Trapping Rain Water | left/right max arrays, single pass |
| Word Break | `Set(words)`; 1D DP `Array(n+1).fill(false)` |
| Course Schedule | adjacency `Array.from({length:n},() => [])` + queue for BFS topo |
| LCA of BST | compare `p` and `q` to `root.val`; iterative descent |

Once these tools feel automatic, the problems become exercises in *which one to pick*, not *how to write code*.
