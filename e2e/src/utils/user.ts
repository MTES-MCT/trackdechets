import { Page, expect } from "@playwright/test";
import { prisma } from "back";

/**
 * Creates an account with provided credentials.
 * Will *not* activate the account via email link.
 */
export const signup = async (page: Page, { username, email, password }) => {
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
  await expect(
    page.getByRole("heading", { name: "On y est presque !" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Se connecter" })
  ).toBeVisible();

  return { username, email, password };
};

/**
 * Activates a created account via the activation hash sent by mail.
 */
export const activateUser = async (page: Page, { email }) => {
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

/**
 * Logs a user in with provided credentials.
 */
export const login = async (page: Page, { email, password }) => {
  // Go to login page
  await page.goto("/login");

  // Fill credentials and click button
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Make sure we are redirected to the account page & Disconnect button is visible
  await page.waitForURL("/account/companies/create");
  await expect(
    page.getByRole("button", { name: "Se déconnecter" })
  ).toBeVisible();

  return { email, password };
};
