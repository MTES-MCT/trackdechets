import { test } from "@playwright/test";
import { uid } from "./utils";

test("create an account", async ({ page }) => {
  const UID = `e2e-${uid()}`;
  const USER_NAME = `User ${UID}`;
  const USER_MAIL = `user.${UID}@mail.com`;

  console.log("USER_NAME", USER_NAME);
  console.log("USER_MAIL", USER_MAIL);

  await page.goto("/");
  await page.goto("/login");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Nom et prénom").click();
  await page.getByLabel("Nom et prénom").fill(USER_NAME);
  await page.getByLabel("Nom et prénom").press("Tab");
  await page.getByLabel("Email").fill(USER_MAIL);
  await page.getByLabel("Email").press("Tab");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Us3r0ne$$$");
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
});
