# How Computers Represent Data

Programming makes a lot more sense once you know what's *under* the variables. This guide is the floor: how computers store numbers, text, and lists. Everything that looks weird about computer math has a reason here.

## Bits and bytes

A **bit** is the smallest unit a computer stores: it holds either `0` or `1`. Nothing else.

A **byte** is 8 bits, glued together. With 8 bits you can express 2⁸ = 256 different combinations: `00000000`, `00000001`, ..., `11111111`. That's the basic unit memory is measured in (kilobytes, megabytes, gigabytes).

Everything a computer stores — your name, this paragraph, an image, a video — is ultimately a long sequence of bits. The interesting question is "what does this particular sequence of bits *represent*?" That depends entirely on which program is reading it.

## Counting in binary

Humans count in **base 10** (also called *decimal*): ten digits, `0` through `9`. When you run out at `9`, you carry to the next position: `10`, `11`, ... `19`, `20`.

Computers count in **base 2** (*binary*): two digits, `0` and `1`. When you run out at `1`, you carry: `10`, `11`, `100`, `101`, `110`, `111`, `1000`.

Each position is a power of 2 instead of 10:

| Binary | Place values | Decimal |
|---|---|---|
| `1` | 1 | 1 |
| `10` | 2 + 0 | 2 |
| `11` | 2 + 1 | 3 |
| `100` | 4 + 0 + 0 | 4 |
| `101` | 4 + 0 + 1 | 5 |
| `1010` | 8 + 0 + 2 + 0 | 10 |
| `1111` | 8 + 4 + 2 + 1 | 15 |
| `10000` | 16 | 16 |

You don't usually write binary by hand. But you'll see references like "32-bit integer" — that means the value is stored in 32 binary digits. With 32 bits you can represent 2³² ≈ 4 billion different values.

## Hexadecimal: a shortcut for binary

Binary is hard for humans to read at a glance. So we often use **base 16** (*hexadecimal*, or just *hex*). Hex digits go `0, 1, 2, ..., 9, a, b, c, d, e, f` — sixteen of them.

Each hex digit happens to map to exactly four binary digits:

| Hex | Binary | Decimal |
|---|---|---|
| `0` | `0000` | 0 |
| `1` | `0001` | 1 |
| `8` | `1000` | 8 |
| `f` | `1111` | 15 |
| `ff` | `11111111` | 255 |
| `100` | `1 0000 0000` | 256 |

So two hex digits give you one byte. That's why CSS colors are hex: `#A8421B` is three bytes — one for red, one for green, one for blue. You'll see hex any time bytes are involved: memory addresses, file formats, network packets.

You usually don't need to write or convert hex by hand either. Just know that **`0x` (or `#`) is the conventional prefix for "this is hex."**

## Integers: the whole numbers

A computer integer is just bits interpreted as a number. With *N* bits, you have *2ᴺ* possible patterns.

Two conventions for what those patterns mean:

- **Unsigned**: all *2ᴺ* patterns represent non-negative numbers `0` through `2ᴺ − 1`.
- **Signed**: half the patterns represent positive numbers (including 0), the other half represent negatives. With 32 bits you get the range from roughly −2.1 billion to +2.1 billion.

You'll usually use *signed* in regular programming. The exact mechanism for representing negatives is called **two's complement** — you can look it up if you're curious, but for interview programming you only need to know that signed integers can be negative and have a fixed range.

### Overflow

If you have a 32-bit signed integer at its maximum value (≈ 2.1 billion) and you add 1, what happens? It *wraps around* to the most negative value (≈ −2.1 billion). This is called **integer overflow** and it has caused real bugs in real systems.

Most interview problems live well within the range of a 32-bit or 64-bit integer, so you can ignore overflow in practice. Two languages handle this differently though:

- **Python integers grow to arbitrary size.** You can compute `2 ** 1000` and Python returns a huge number, no overflow.
- **JavaScript numbers are all 64-bit floats** (see next section). Integers stay precise up to about 2⁵³ — beyond that, you lose precision. For very large integers, JavaScript has a separate `BigInt` type.

## Floats: numbers with fractional parts

A **floating-point** number is how computers represent decimals like `3.14` or `0.001`. The "floating" refers to the decimal point being able to move — like scientific notation, where `1.23 × 10⁵` and `1.23 × 10⁻⁵` use the same compact form.

The standard way computers store these is called **IEEE 754**. With 64 bits you get about 15-17 decimal digits of precision and a huge range. The catch:

```
0.1 + 0.2 = 0.30000000000000004
```

Yes, really. Test it in any language. It's not a bug — it's a consequence of how IEEE 754 stores numbers in binary. The fractions `0.1` and `0.2` cannot be represented exactly in binary, so what's stored is a *very close* approximation. The error is small but it accumulates in arithmetic.

The practical impact:

- **Never compare floats with `==`.** Use "is the difference small enough?" instead: `abs(a - b) < 0.0001`.
- **Be careful with money.** For currency, work in cents (integers) and only divide at the end, or use a decimal-arithmetic library.

For most interview problems, you'll only deal with integers, so this rarely matters. But it's the most common surprise in any first encounter with floats.

## Characters and strings

Computers store *text* as numbers too. Every character is mapped to a number, and the program knows to interpret that range of memory "as text."

The original mapping was **ASCII**: the letters `A`-`Z` are numbers `65`-`90`, the lowercase `a`-`z` are `97`-`122`, digits `0`-`9` are `48`-`57`. ASCII covers 128 values total, fitting into 7 bits — enough for English, not enough for the rest of the world.

The modern standard is **Unicode**, which assigns numbers to every character in every script (plus emoji). Unicode has over 100,000 characters. The encoding most commonly used is **UTF-8**, which uses one byte for ASCII characters and up to four bytes for less common ones.

For interview problems you almost always work with plain ASCII, so:

- A character is a small integer.
- A string is a sequence of characters.

In both Python and JavaScript:

```
ord("A")    →  65       (character to its numeric code)
chr(65)     →  "A"      (number back to character)
```

You'll use this for tricks like "is this character a lowercase letter?":

```
ord("a") ≤ ord(c) ≤ ord("z")
```

## Lists / arrays: numbered slots

A **list** (or **array**) is an ordered collection of values, stored in adjacent slots of memory. Each slot has a number — its **index** — telling the computer "the third item" or "the seventh item."

```
let names = ["Maria", "Ahmed", "Yuki", "Lucia"]
```

Here `names[0]` is `"Maria"`, `names[1]` is `"Ahmed"`, `names[2]` is `"Yuki"`, `names[3]` is `"Lucia"`.

### Zero-based indexing

Why does the first element have index *zero*, not *one*? Because the index is technically "how many slots from the start." The first element is zero slots in. The second is one slot in. It's awkward at first but ubiquitous.

Two consequences of this convention:

- **The last index is `length − 1`.** A list of length 4 has indices 0, 1, 2, 3.
- **Off-by-one errors.** If you write a loop and accidentally go one too far, you read past the end of the list. This is one of the most common bugs in programming. The cure: be precise about whether your loop should reach `length` or `length − 1`.

### Arrays are contiguous

Items are stored next to each other in memory, in order. This makes "give me item at index 5" extremely fast — the computer can jump directly to that memory location. But it makes "insert an item in the middle" slow — every item after the insertion has to shift over.

This is the underlying reason for cost differences you'll see later. `list.append(x)` (add at the end) is fast. `list.insert(0, x)` (add at the beginning) is slow.

## The modulo operator: `%`

You'll see `%` everywhere in interview code. It means **remainder after dividing**.

```
17 % 5  →  2     (because 17 = 3 × 5 + 2)
10 % 2  →  0     (10 is evenly divisible by 2)
7  % 3  →  1     (because 7 = 2 × 3 + 1)
```

Three places modulo is essential:

### Detecting even / odd

```
if n % 2 == 0:
    print("even")
```

A number is even exactly when its remainder after dividing by 2 is zero.

### Wrapping around (cyclic indexing)

If you have a list of 4 items and you want index `5` to "wrap around" back to the start:

```
i % 4   →   2          (when i = 6, since 6 = 1×4 + 2)
```

This is how clock arithmetic works (24 % 24 = 0, the day "wraps").

### Checking divisibility

```
if year % 4 == 0:
    print("might be a leap year")
```

If `n % k == 0`, then `n` is divisible by `k`. Modulo is the divisibility test.

## Integer division

When you divide two integers, you face a choice:

- `7 / 2` could give you `3.5` (a float).
- `7 / 2` could give you `3` (the integer part, throwing away the remainder).

Different languages default differently:

- **Python 3**: `7 / 2 = 3.5`, and `7 // 2 = 3` (the `//` operator is "integer division").
- **JavaScript**: `7 / 2 = 3.5`. To get the integer part, use `Math.floor(7 / 2)` → `3`.

When you're computing things like the middle of an array (`mid = (lo + hi) // 2`), you usually want integer division. Picking the wrong form gives you decimals where you wanted integers.

## Truth, falsehood, and zero

Booleans (`true` / `false`) are the answers to comparisons. But in most languages, other values can also be "interpreted as" boolean. The rules vary, but typically:

- **Zero, empty string, empty list, and "nothing"** (`None` in Python, `null`/`undefined` in JS) are *falsy*.
- **Every other value** is *truthy*.

So `if mylist:` is a shorthand for "if mylist has any elements." Useful, but a real source of bugs: `if score:` is `False` when `score = 0`, which might or might not be what you wanted.

Be deliberate about checking for `0` vs checking for "empty/missing."

## Two more things you'll see

### Bitwise operators

You'll occasionally see operators like `&` (bitwise AND), `|` (bitwise OR), `^` (XOR), `<<` (left shift), `>>` (right shift). They operate on the individual bits of integers. The two you'll most likely meet in interview code:

- `(lo + hi) >> 1` — same as `(lo + hi) // 2`, slightly faster. Sometimes used in binary search.
- `n & 1` — same as `n % 2`. True (1) if `n` is odd.

You can ignore bitwise operators until they show up in a specific problem. Most interview problems don't need them.

### Hash codes and hash maps

A **hash code** is a number derived from a value (any value) using a function called a *hash function*. The goal: very different inputs should produce very different hash codes, while the same input always produces the same hash code.

You don't compute hash codes yourself in interview code. But you use them indirectly *every time* you use a dictionary, map, or set — those data structures use hashing to give you "look up by key in roughly one step" rather than "search the whole structure." It's why `dict.get("Maria")` is fast even when the dict has a million entries.

## What to do next

Now that you have the data model:

- Read [How to Think About Programs](/learn/thinking-in-programs/) if you haven't yet — that covers variables, control flow, and functions as concepts.
- Then dive into [Python Foundations](/learn/01-python-foundations/) or [JavaScript Foundations](/learn/02-javascript-foundations/) for the actual syntax.
- After that, the problems and the [Algorithmic Patterns](/learn/03-algorithmic-patterns/) guide will start to make sense as concrete versions of "use this data structure for this kind of problem."

Programming gets dramatically easier once these foundations stop being surprising.
