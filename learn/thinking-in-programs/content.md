# How to Think About Programs

You don't need to know Python or JavaScript yet. This guide is about the *mental model* underneath every programming language. Once it clicks, learning syntax is mostly looking up "how do I say *this* in *that* language."

## What a program is, actually

A program is a list of instructions for a computer to follow, in order, one at a time. That's it. The computer is unbelievably fast and unbelievably literal. It will do exactly what you wrote, even if what you wrote isn't what you meant.

Two consequences of "exactly what you wrote":

1. **Order matters.** A program that adds `1` then multiplies by `2` gives a different answer than the same operations in the opposite order.
2. **Spelling matters.** A computer treats `total` and `Total` as two completely different things. There is no "you know what I meant."

Programming is the discipline of being more precise than you usually need to be in life.

## Variables: labeled boxes

A **variable** is a name attached to a value. Think of it as a small box with a label on it. You put a value in, and from then on, you can refer to the value by the label.

```
let age = 30          ← put the number 30 into a box labeled "age"
let name = "Maria"    ← put the text "Maria" into a box labeled "name"
```

Once it has a value, you can use the label anywhere the value would go:

```
print(age)            ← prints 30
print(age + 5)        ← prints 35
```

You can replace what's in the box (in most languages):

```
age = 31              ← the box labeled "age" now holds 31, not 30
```

That's the whole concept. Every program is built on top of it.

### Why "variable" and not "constant"?

Because it varies — the value in the box can change as the program runs. Some languages let you say "this box, once filled, can never change" (a *constant*). That's a contract you give the computer to help catch mistakes.

## Types: what kind of thing is in the box

Every value has a *type*. The big four you'll see immediately:

- **Number** — `30`, `3.14`, `-7`
- **Text / string** — `"hello"`, `"Maria"` (the quotes are part of telling the computer it's text)
- **Boolean** — `true` or `false`, the answers to yes/no questions
- **Nothing** — a special value meaning "no value yet" (called `None` in Python, `null` in JavaScript)

The type tells the computer what operations make sense. Adding two numbers works. Adding two strings *concatenates* them (`"hello" + " world"` becomes `"hello world"`). Adding a number and a string is usually an error or does something surprising.

## Operations: what you can do with values

The basics carry over from math:

```
+    add (or concatenate strings)
-    subtract
*    multiply
/    divide
%    "remainder after dividing"  ← this one's used constantly; see "Numbers, Bits, and Strings"
```

And comparison, which always produces a true/false answer:

```
==   "is equal to"                ← note: TWO equals signs.  ONE equals sign means "assign"
!=   "is not equal to"
<    less than
>    greater than
<=   "less than or equal to"
>=   "greater than or equal to"
```

Comparison results are *booleans*. They're how you make decisions.

## Control flow: decisions

Plain programs run top-to-bottom. But often you want to do one thing in one situation and a different thing in another. That's an **if statement**:

```
if age >= 18:
    print("can vote")
else:
    print("cannot vote yet")
```

You can read this almost in English. The computer evaluates `age >= 18` — true or false? If true, runs the first block. If false, runs the second.

You can chain decisions with `else if` (spelled `elif` in Python):

```
if score >= 90:
    grade = "A"
else if score >= 80:
    grade = "B"
else if score >= 70:
    grade = "C"
else:
    grade = "F"
```

The computer checks each condition in order and runs the first one that matches.

## Control flow: repetition (loops)

The other common need is "do this thing many times." That's a **loop**.

```
for i in 1, 2, 3, 4, 5:
    print(i * i)
```

This prints `1, 4, 9, 16, 25`. The variable `i` takes each value in turn, and the body runs once per value.

A more common shape is "do this for every item in a list":

```
for word in ["apple", "banana", "cherry"]:
    print(word)
```

When you don't know in advance how many times to loop, use a **while loop** — keep going while a condition is true:

```
while balance > 0:
    balance = balance - 10
    print("withdrew 10, balance is now", balance)
```

The single most common bug at this stage: forgetting to update the variable inside the loop, so the condition is *always* true and the loop never stops. That's called an **infinite loop**. You'll write one eventually. It's fine. Stop the program and add the missing update.

## Functions: reusable recipes

When you find yourself writing the same chunk of logic in multiple places, you can package it as a **function**.

```
function area(width, height):
    return width * height
```

You've defined a *recipe* called `area` that takes two ingredients (`width` and `height`) and produces (`return`s) their product.

Then you can use the recipe anywhere:

```
room_area = area(12, 10)        ← 120
total = area(8, 6) + area(4, 4) ← 48 + 16 = 64
```

The values you pass in (`12`, `10`) are called **arguments**. The names inside the function definition (`width`, `height`) are called **parameters**. The function gets to use them as if they were local variables.

Three reasons to write functions:

1. **Reuse** — write once, use everywhere.
2. **Naming** — `compute_tax(salary)` reads better than four lines of arithmetic.
3. **Decomposition** — break a hard problem into smaller, named pieces.

## Decomposition: the actual skill

If you remember nothing else from this guide, remember this: **the work of programming is breaking a big problem into small problems that are individually obvious.**

If someone says "write a program that finds the most common word in a paragraph," that's vague and intimidating. But it decomposes:

1. Split the paragraph into words.
2. Count how often each word appears.
3. Find the word with the highest count.

Now each of those three is roughly the size of a function — clear, named, individually doable. If step 2 still feels hard, decompose it further:

  2a. Make an empty tally.
  2b. For each word, add 1 to its entry in the tally.
  2c. Return the tally.

Keep decomposing until each piece is small enough that the code writes itself.

The hardest part of programming is rarely "I don't know the syntax." It's "the problem still feels too big to start." The cure is to break it down one more level.

## Pseudocode: planning without committing

**Pseudocode** is fake code — recipe-style instructions written in plain English (or your language of choice), without the strict rules of a real programming language. You use it to plan.

For "find the most common word in a paragraph":

```
take the paragraph
break it into a list of words (split on spaces)
make an empty tally
for each word:
    if the word is already in the tally, add 1 to its count
    otherwise, put the word in the tally with count 1
find the entry in the tally with the largest count
return its word
```

That's not Python. That's not JavaScript. But it's *almost* code, and translating it to a real language is mechanical. Many experienced programmers sketch pseudocode before writing real code.

## Tracing code by hand: the underrated skill

When something doesn't work, the fastest way to understand why is to **trace** it — walk through the code line by line with pencil and paper, writing down what each variable holds at each step.

Take this little function:

```
function sum_to(n):
    total = 0
    for i in 1, 2, ..., n:
        total = total + i
    return total
```

Trace `sum_to(4)`:

| Step | i | total |
|---|---|---|
| start | — | 0 |
| iter 1 | 1 | 0 + 1 = 1 |
| iter 2 | 2 | 1 + 2 = 3 |
| iter 3 | 3 | 3 + 3 = 6 |
| iter 4 | 4 | 6 + 4 = 10 |
| return | — | 10 |

You can do this for any code. When you get fluent at tracing, you start to see bugs before you even run the program. This is *the* skill that separates someone who writes code from someone who debugs code.

## The debugging mindset

Bugs aren't a failure of you. They're a failure of *the model in your head* vs *the model in the machine*. Debugging is the process of figuring out which differ, then changing your model until they match.

A reliable loop:

1. **Reproduce the bug.** What input produced what wrong output?
2. **Form a hypothesis.** "I think the loop is running one extra time."
3. **Test the hypothesis.** Add a `print` showing the loop counter. Run again.
4. **Update your model.** Either the hypothesis was right (fix it) or wrong (form a new one).

Notice you never *think* harder about what the code does. You *make the code show you* what it does. The print statement (or a debugger) is the truth; your understanding is the hypothesis.

## What to do next

You have enough mental model to start writing real code. Two paths from here:

- **For Python**: read the [Python Foundations](/learn/01-python-foundations/) guide. Python's syntax is the closest to the pseudocode in this guide.
- **For JavaScript**: read the [JavaScript Foundations](/learn/02-javascript-foundations/) guide.

Before that, you might also want [How Computers Represent Data](/learn/data-representation/) — it covers bits, integers, floats, characters, and a few specific operations (especially the percent / modulo operator) that come up constantly without obvious meaning.

Programming is a skill that grows by doing, not by reading. Read just enough to start. Then start.
