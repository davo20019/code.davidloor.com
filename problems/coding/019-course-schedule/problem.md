# Course Schedule

There are `numCourses` courses labeled from `0` to `numCourses - 1`. You are given a list of `prerequisites` where `prerequisites[i] = [a, b]` means you must take course `b` before course `a`.

Return `true` if you can finish all courses (i.e., the prerequisite graph has no cycle), otherwise return `false`.

## Example

Input: `numCourses = 2`, `prerequisites = [[1, 0]]`
Output: `true`
Explanation: Take course 0 first, then course 1.

Input: `numCourses = 2`, `prerequisites = [[1, 0], [0, 1]]`
Output: `false`
Explanation: There is a cycle.

## Constraints
- 1 <= numCourses <= 2000
- 0 <= prerequisites.length <= 5000
- prerequisites[i].length == 2
- 0 <= a, b < numCourses
- All prerequisite pairs are unique
