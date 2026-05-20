function threeSum(nums) {
  nums = [...nums].sort((a, b) => a - b);
  const res = []; const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let l = i + 1, r = n - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) { res.push([nums[i], nums[l], nums[r]]); while (l < r && nums[l] === nums[l+1]) l++; while (l < r && nums[r] === nums[r-1]) r--; l++; r--; }
      else if (s < 0) l++; else r--;
    }
  }
  return res;
}
