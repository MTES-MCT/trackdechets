import { Page, expect } from "@playwright/test";
import { prisma } from "back";

/**
 * Logs a user in with provided credentials. Makes no assertion.
 */
export const login = async (page: Page, { email, password }) => {
  // Go to login page
  await page.goto("/login");

  // Fill credentials and click button
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  return { email, password };
};

/**
 * Logs a user in with provided credentials. Asserts that login failed
 */
export const failedLogin = async (page: Page, { email, password }) => {
  // Login
  await login(page, { email, password });

  // Error should pop
  await expect(page.getByRole("heading", { name: "Erreur" })).toBeVisible();
  await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();

  // Login button still visible
  await expect(
    page.getByRole("button", { name: "Se connecter" })
  ).toBeVisible();

  return { email, password };
};

/**
 * Logs a user in with provided credentials. Asserts that login succeeded
 */
export const successfulLogin = async (page: Page, { email, password }) => {
  // Login
  await login(page, { email, password });

  // Make sure we are redirected to the account page & Disconnect button is visible
  await page.waitForURL("/account/companies/create");
  await expect(
    page.getByRole("button", { name: "Se déconnecter" })
  ).toBeVisible();

  return { email, password };
};

/**
 * Creates an account with provided credentials. Makes no assertion.
 * Will *not* activate the account via email link.
 */
export const signup = async (page: Page, { username, email, password }) => {
  await page.goto("/signup");

  // Name
  await page.getByLabel("Nom et prénom").fill(username);

  // Email
  await page.getByLabel("Email").fill(email);

  // Password
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);

  // Terms + confirmation
  await page.getByText("Je certifie avoir lu les conditions générales").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  return { username, email, password };
};

/**
 * Tests the password policy visual feedback in the signup form
 */
export const testSignupPasswordPolicy = async (page: Page) => {
  // Password is too short
  await signup(page, {
    username: "Username",
    email: "user@mail.com",
    password: "aa"
  });
  await expect(page.getByRole("heading", { name: "Trop court" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer mon compte" })
  ).toBeDisabled();

  // Password is too weak
  await signup(page, {
    username: "Username",
    email: "user@mail.com",
    password: "aaaaaaaaaaa"
  });
  await expect(
    page.getByRole("heading", { name: "Insuffisant" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer mon compte" })
  ).toBeDisabled();

  // Strong password
  await signup(page, {
    username: "Username",
    email: "user@mail.com",
    password: "AMmlN098Y1$$19081N"
  });
  await expect(page.getByRole("heading", { name: "Parfait" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer mon compte" })
  ).not.toBeDisabled();
};

/**
 * Creates an account with provided credentials.
 * Will *not* activate the account via email link.
 */
export const successfulSignup = async (
  page: Page,
  { username, email, password }
) => {
  await signup(page, { username, email, password });

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
