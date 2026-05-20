import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("two-sum reference solution passes all tests", async ({ page }) => {
  const solution = readFileSync(path.resolve("problems/coding/001-two-sum/solution.js"), "utf8");

  await page.goto("/problems/001-two-sum/");
  await page.getByRole("button", { name: "JavaScript" }).click();

  // Replace the editor's contents with the reference solution.
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(solution);

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/3\s*\/\s*3 passed/)).toBeVisible({ timeout: 30_000 });
});
