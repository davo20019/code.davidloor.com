# Group Anagrams

Given an array of strings, group all strings that are anagrams of each other together.

Two strings are anagrams if they contain the same characters in the same frequencies (regardless of order). Return a list of groups; the order of the groups and the order of strings within each group does not matter.

## Example

Input: `strs = ["eat","tea","tan","ate","nat","bat"]`
Output: `[["eat","tea","ate"],["tan","nat"],["bat"]]`

## Constraints
- 1 <= strs.length <= 10^4
- 0 <= strs[i].length <= 100
- strs[i] consists of lowercase English letters
