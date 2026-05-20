# Binary Search

Given a sorted array of integers `nums` in ascending order and a `target` integer, write a function to search for `target` in `nums`. If `target` exists, return its index; otherwise, return `-1`. Your algorithm must run in O(log n) time.

## Example

Input: `nums = [-1,0,3,5,9,12]`, `target = 9` → Output: `4`
Explanation: 9 exists in `nums` and its index is 4.

Input: `nums = [-1,0,3,5,9,12]`, `target = 2` → Output: `-1`
Explanation: 2 does not exist in `nums`.

## Constraints
- 1 ≤ nums.length ≤ 10⁴
- -10⁴ ≤ nums[i], target ≤ 10⁴
- All integers in `nums` are unique.
- `nums` is sorted in ascending order.
