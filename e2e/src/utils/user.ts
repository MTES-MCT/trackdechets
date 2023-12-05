import { Page, expect } from "@playwright/test";
import { prisma } from "back";

export const createAccount = async (
  page: Page,
  { username, email, password }
) => {
  await page.goto("/signup");

  // Name
  await page.getByLabel("Nom et prénom").fill(username);

  // Email
  await page.getByLabel("Email").fill(email);

  // Password. Strength should be indicated
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await expect(page.getByText("ParfaitVotre mot de passe est")).toBeVisible();

  // Terms + confirmation
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // If successful, we should see the page with email confirmation info
  await expect(
    page.getByRole("heading", { name: "On y est presque !" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Se connecter" })
  ).toBeVisible();

  return { username, email, password };
};

export const confirmAccount = async (page: Page, { email }) => {
  const userAccountHash = await prisma.userAccountHash.findFirstOrThrow({
    where: { email }
  });

  await page.goto(`/user-activation?hash=${userAccountHash.hash}`);

  return { email, userAccountHash };
};
