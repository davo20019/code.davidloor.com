# Word Break

Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.

Note that the same word in the dictionary may be used multiple times.

## Example

Input: `s = "leetcode"`, `wordDict = ["leet", "code"]`
Output: `true`
Explanation: `"leetcode"` can be segmented as `"leet code"`.

Input: `s = "applepenapple"`, `wordDict = ["apple", "pen"]`
Output: `true`

## Constraints
- 1 <= s.length <= 300
- 1 <= wordDict.length <= 1000
- 1 <= wordDict[i].length <= 20
- s and wordDict[i] consist of only lowercase English letters
- All words in wordDict are unique
