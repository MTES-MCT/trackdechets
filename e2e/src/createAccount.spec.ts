import { test } from "@playwright/test";

test("create an account", async ({ page }) => {
  const USER_NAME = `User 1`;
  const USER_MAIL = `user.1@mail.com`;
  const USER_PASSWORD = "Us3r0ne$$$";

  await page.goto("/");
  await page.goto("/login");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Nom et prénom").click();
  await page.getByLabel("Nom et prénom").fill(USER_NAME);
  await page.getByLabel("Nom et prénom").press("Tab");
  await page.getByLabel("Email").fill(USER_MAIL);
  await page.getByLabel("Email").press("Tab");
  await page.getByLabel("Mot de passe", { exact: true }).fill(USER_PASSWORD);
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
});
