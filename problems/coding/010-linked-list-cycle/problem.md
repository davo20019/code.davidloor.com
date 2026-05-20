# Linked List Cycle

Given the head of a linked list, determine if the linked list contains a cycle. A cycle exists if some node in the list can be reached again by continuously following the `next` pointer. Return `true` if there is a cycle, or `false` otherwise.

The classic approach is Floyd's cycle-detection (two-pointer / "tortoise and hare") which uses O(1) extra space.

## Example

Input: `head = [3,2,0,-4]` (cycle: tail connects back to index 1) → Output: `true`
Input: `head = [1,2]` (cycle: tail connects back to index 0) → Output: `true`
Input: `head = [1]` (no cycle) → Output: `false`

## Constraints
- The number of nodes is in the range `[0, 10⁴]`.
- -10⁵ ≤ Node.val ≤ 10⁵

## v1 Limitation

The v1 test schema cannot express cyclic input; all test cases use acyclic lists where the expected answer is always `false`. v1.1 may extend the schema with a `cycleIndex` per test case to support cycle inputs.
