# Contributing

## Add a new coding problem

1. Create `problems/coding/NNN-slug/` (next free number, kebab-case slug).
2. Add six files (see existing problems for examples):
   - `problem.md` — statement
   - `starter.py`, `starter.js` — stubs
   - `solution.py`, `solution.js` — reference solutions used by CI
   - `tests.json` — list of `{ input, expected }`
   - `meta.yaml` — title, difficulty, entry function name, signature, validator
3. Run `npm run validate:problems` locally — it must pass.
4. Open a PR.

## Validators

| kind | when to use |
| - | - |
| `exact` | order-sensitive |
| `set` | order-insensitive flat list |
| `set_of_lists` | unordered outer, ordered inner |
| `set_of_sets` | both unordered (e.g., 3Sum) |
| `any_of` | multiple valid answers (`expected` is an array of acceptable answers) |
| `linked_list_value_equal` | linked-list output (serialized to array by harness) |
| `tree_isomorphic` | tree output (BFS-array form) |

## Conventions

- Use the JS naming convention (camelCase) for `entry` in both languages.
- Do NOT use the identifier `__harness_args__` in user-visible code (reserved by the JS harness).

## Add a new system-design prompt

1. Create `problems/system-design/NNN-slug/` with `problem.md` + `meta.yaml`.
2. PR.
