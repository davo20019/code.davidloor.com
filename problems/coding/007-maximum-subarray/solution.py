def maxSubArray(nums):
    best = cur = nums[0]
    for v in nums[1:]:
        cur = max(v, cur + v); best = max(best, cur)
    return best
