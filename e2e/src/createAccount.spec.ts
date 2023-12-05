import { test } from "@playwright/test";
import { createAccount, confirmAccount } from "./utils/user";

test("create an account", async ({ page }) => {
  const USER_NAME = `User e2e n°1`;
  const USER_EMAIL = `user.e2e.n1@mail.com`;
  const USER_PASSWORD = "Us3r_E2E_0ne$$$";

  // Create the account
  await createAccount(page, {
    username: USER_NAME,
    email: USER_EMAIL,
    password: USER_PASSWORD
  });

  // Confirm the account via email link
  await confirmAccount(page, { email: USER_EMAIL });
});
