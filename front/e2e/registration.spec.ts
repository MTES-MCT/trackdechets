import { test } from "@playwright/test";

test("User ONE should be able to register", async ({ page }) => {
  console.log("========================================================");
  console.log("========================= E2E ==========================");
  console.log("========================================================");
  console.log("env", process.env);

  await page.goto("http://trackdechets.local/login");
  await page.getByLabel("Email").click();
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Nom et prénom").click();
  await page.getByLabel("Nom et prénom").fill("User ONE");
  await page.getByLabel("Nom et prénom").press("Tab");
  await page.getByLabel("Email").fill("user.one@beta.gouv.fr");
  await page.getByLabel("Email").press("Tab");
  await page.getByLabel("Mot de passe", { exact: true }).click();
  await page.getByLabel("Mot de passe", { exact: true }).fill("Tr4ckDeChEt7!");
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
});
