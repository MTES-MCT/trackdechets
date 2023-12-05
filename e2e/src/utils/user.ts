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
  await expect(page.getByText("Votre mot de passe est robuste")).toBeVisible();

  // Terms + confirmation
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // If successful, we should see the page with email confirmation info
  const buffer = await page.screenshot();
  console.log(buffer.toString("base64"));
  await expect(
    page.getByRole("heading", { name: "On y est presque !" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Se connecter" })
  ).toBeVisible();

  return { username, email, password };
};

export const confirmAccount = async (page: Page, { email }) => {
  // Fetch activation link in the DB
  const user = await prisma.user.findFirstOrThrow({ where: { email } });
  const userAccountHash = await prisma.userActivationHash.findFirstOrThrow({
    where: { userId: user.id }
  });

  // Go to activation link
  await page.goto(`/user-activation?hash=${userAccountHash.hash}`);

  // Activate account
  await page.getByRole("button", { name: "Activer mon compte" }).click();

  // Make sure activation message is visible
  await expect(page.getByText("Votre compte est créé !")).toBeVisible();

  return { email, userAccountHash };
};
