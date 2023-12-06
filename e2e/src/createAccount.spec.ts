import { test } from "@playwright/test";
import { signup, activateUser, login } from "./utils/user";

test.describe("Cahier de recette utilisateur", () => {
  const USER_NAME = `User e2e n°1`;
  const USER_EMAIL = `user.e2e.n1@mail.com`;
  const USER_PASSWORD = "Us3r_E2E_0ne$$$";

  test("Signup", async ({ page }) => {
    await signup(page, {
      username: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Activation", async ({ page }) => {
    await activateUser(page, { email: USER_EMAIL });
  });

  test("Login", async ({ page }) => {
    await login(page, { email: USER_EMAIL, password: USER_PASSWORD });
  });
});
