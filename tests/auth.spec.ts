/**
 * e2e/auth.spec.ts
 *
 * End-to-end smoke test for the full authentication flow:
 *   1. Visit "/" → unauthenticated → redirected to /login
 *   2. Register a new account → land on the dashboard
 *   3. Log out → redirected back to /login
 *   4. Log back in with the same credentials → land on the dashboard
 *
 * Requires: the dev server running on http://localhost:8080 (npm run dev)
 * Run with: npx playwright test
 */

import { test, expect } from "@playwright/test";

// ── Unique email per test run to avoid DB conflicts ───────────────────────────

const timestamp = Date.now();
const TEST_EMAIL = `e2e-user-${timestamp}@cryptolens-test.com`;
const TEST_PASSWORD = "TestPass1"; // meets: 8 chars, uppercase, number
const TEST_NAME = "E2E User";

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Authentication flow", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");

    // Should land on login
    await expect(page).toHaveURL(/\/login/);

    // Login form should be visible
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("new user can register and reach the dashboard", async ({ page }) => {
    await page.goto("/register");

    // Fill registration form
    const nameInput = page.getByLabel(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill(TEST_NAME);
    }

    await page.getByLabel(/email/i).fill(TEST_EMAIL);

    // Fill both password fields (confirm password may exist)
    const passwordInputs = page.getByLabel(/password/i);
    const count = await passwordInputs.count();
    for (let i = 0; i < count; i++) {
      await passwordInputs.nth(i).fill(TEST_PASSWORD);
    }

    await page.getByRole("button", { name: /register|create account|sign up/i }).click();

    // Wait for navigation to complete — should land on dashboard (/)
    await expect(page).toHaveURL(/^\/?$|\/dashboard/, { timeout: 10_000 });

    // Dashboard heading or a known dashboard element should be visible
    const dashboardContent = page.locator("h1, [data-testid='dashboard']").first();
    await expect(dashboardContent).toBeVisible({ timeout: 10_000 });
  });

  test("authenticated user can log out", async ({ page }) => {
    // First log in
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();

    await expect(page).toHaveURL(/^\/?$|\/dashboard/, { timeout: 10_000 });

    // Find and click the logout button (may be inside a menu/user dropdown)
    const logoutButton = page.getByRole("button", { name: /log ?out|sign ?out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Logout may be inside a dropdown — try clicking a user menu first
      const userMenu = page.locator("[aria-label*='user'], [aria-label*='account'], [data-testid*='user']").first();
      await userMenu.click();
      await page.getByRole("menuitem", { name: /log ?out|sign ?out/i }).click();
    }

    // After logout, should be back at login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("registered user can log back in", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();

    // Should land on dashboard
    await expect(page).toHaveURL(/^\/?$|\/dashboard/, { timeout: 10_000 });
  });

  test("login with wrong password shows an error message", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill("WrongPass999");
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();

    // An error/toast should appear — stays on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    // Look for an error message in the UI
    const errorLocator = page.locator("[role='alert'], .text-red, [data-testid*='error']").first();
    await expect(errorLocator).toBeVisible({ timeout: 5_000 });
  });

  test("register with an already-used email shows an error", async ({ page }) => {
    await page.goto("/register");

    const nameInput = page.getByLabel(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill(TEST_NAME);
    }

    // Reuse the same email from the first test
    await page.getByLabel(/email/i).fill(TEST_EMAIL);

    const passwordInputs = page.getByLabel(/password/i);
    const count = await passwordInputs.count();
    for (let i = 0; i < count; i++) {
      await passwordInputs.nth(i).fill(TEST_PASSWORD);
    }

    await page.getByRole("button", { name: /register|create account|sign up/i }).click();

    // Should stay on register page (no redirect to dashboard)
    await expect(page).toHaveURL(/\/register/, { timeout: 5_000 });
  });
});
