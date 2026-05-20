# Search in Rotated Sorted Array

There is an integer array `nums` sorted in ascending order that has been rotated at some pivot index. Given the rotated array and an integer `target`, return the index of `target` if it is in the array, or `-1` if it is not.

You must write an algorithm with O(log n) runtime complexity.

## Example

Input: `nums = [4,5,6,7,0,1,2]`, `target = 0`
Output: `4`

Input: `nums = [4,5,6,7,0,1,2]`, `target = 3`
Output: `-1`

## Constraints
- 1 <= nums.length <= 5000
- -10^4 <= nums[i] <= 10^4
- All values in `nums` are unique
- -10^4 <= target <= 10^4
