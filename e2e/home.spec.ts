import { expect, test } from "@playwright/test";

test("serves the placeholder page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Waymark" })).toBeVisible();
});
