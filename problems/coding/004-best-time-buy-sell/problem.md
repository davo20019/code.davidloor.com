# Best Time to Buy and Sell Stock

You are given an array `prices` where `prices[i]` is the price of a stock on day `i`. You want to maximize profit by choosing a single day to buy and a later day to sell. Return the maximum profit you can achieve. If no profit is possible, return `0`.

## Example

Input: `prices = [7,1,5,3,6,4]` → Output: `5`
Explanation: Buy on day 2 (price=1), sell on day 5 (price=6). Profit = 6 - 1 = 5.

Input: `prices = [7,6,4,3,1]` → Output: `0`
Explanation: Prices only decrease; no transaction gives a profit.

## Constraints
- 1 ≤ prices.length ≤ 10⁵
- 0 ≤ prices[i] ≤ 10⁴
