import { test, expect } from "@playwright/test";

const uniqueEmail = () => `e2e.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;

test("AI chat cashflow clarify → choice → confirm", async ({ page, request }) => {
  const email = uniqueEmail();
  const password = "Password123!";

  // Signup via API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const signup = await request.post(`${apiUrl}/auth/signup`, {
    data: { email, password, organizationName: `Org-${Date.now()}`, name: "E2E" }
  });
  expect(signup.ok()).toBeTruthy();
  const body = await signup.json();
  const token = body.token as string;

  // Set auth in localStorage before app loads
  await page.addInitScript(
    ({ token }) => {
      localStorage.setItem("propai_token", token);
    },
    { token }
  );

  await page.goto("/");

  // Send message
  await page.getByPlaceholder(/message/i).fill("Log an expense $50 today");
  await page.getByRole("button", { name: /send/i }).click();

  // Expect draft/clarify UI
  await expect(page.getByText(/draft/i)).toBeVisible();
  // Choose a category option if rendered
  const util = page.getByRole("button", { name: "Utilities" });
  if (await util.count()) {
    await util.first().click();
  }

  // Confirm
  const confirm = page.getByRole("button", { name: /^confirm$/i });
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.getByText(/saved/i)).toBeVisible();
});

