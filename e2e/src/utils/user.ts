import { Page, expect } from "@playwright/test";
import { prisma } from "back";
import { goTo } from "./navigation";

/**
 * Logs a user in with provided credentials. Makes no assertion.
 */
export const login = async (page: Page, { email, password }) => {
  // Go to login page
  await goTo(page, "/login");

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
  await goTo(page, "/signup");

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
  await goTo(page, `/user-activation?hash=${userAccountHash.hash}`);

  // Activate account
  await page.getByRole("button", { name: "Activer mon compte" }).click();

  // Make sure activation message is visible
  await expect(page.getByText("Votre compte est créé !")).toBeVisible();

  return { email, userAccountHash };
};

/**
 * Will navigate to the account page and verify that account data is accurate.
 * You can pass any of the input params to check them separately.
 */
interface TestAccountInfoProps {
  email?: string;
  username?: string;
  phone?: string;
}
export const testAccountInfo = async (
  page: Page,
  { email, username, phone }: TestAccountInfoProps
) => {
  // Go to account page
  await goTo(page, "/account/info");

  // Verify account data
  if (email) await expect(page.getByText(`Email${email}`)).toBeVisible();
  if (username)
    await expect(page.getByText(`Nom utilisateur${username}`)).toBeVisible();
  if (phone) await expect(page.getByText(`Téléphone${phone}`)).toBeVisible();

  return { email, username, phone };
};

/**
 * Modifies the phone number on the account page. Does not make any assertion.
 */
export const updatePhoneNbr = async (page, { phone }) => {
  // Go to account page
  await goTo(page, "/account/info");

  const phoneInput = page.getByPlaceholder("Téléphone");
  if (!(await phoneInput.isVisible())) {
    // Click on the button to modify phone number. Tricky: can either
    // be labelled "Ajouter" or "Modifier", and is a div, not a button
    await page
      .locator("text=Téléphone")
      .locator("..")
      .locator('div:has-text("Ajouter"), div:has-text("Modifier")')
      .click();
  }

  // Fill in new phone number and validate
  await page.getByPlaceholder("Téléphone").click();
  await page.getByPlaceholder("Téléphone").fill(phone);
  await page.getByRole("button", { name: "Valider" }).click();
};

/**
 * Tests the constraints on the phone input, with invalid and valid phone numbers.
 * Will ultimately clear the input.
 */
export const testPhoneNbrUpdate = async page => {
  // Regular numbers

  // Too long
  await updatePhoneNbr(page, { phone: "04710000000" });
  await expect(
    page.getByText("Merci de renseigner un numéro de téléphone valide")
  ).toBeVisible();

  // Too short
  await updatePhoneNbr(page, { phone: "047100000" });
  await expect(
    page.getByText("Merci de renseigner un numéro de téléphone valide")
  ).toBeVisible();

  // Valid
  await updatePhoneNbr(page, { phone: "0471000000" });
  await testAccountInfo(page, { phone: "0471000000" });

  // +33 Number

  // Too long
  await updatePhoneNbr(page, { phone: "+336000000000" });
  await expect(
    page.getByText("Merci de renseigner un numéro de téléphone valide")
  ).toBeVisible();

  // Too short
  await updatePhoneNbr(page, { phone: "+3360000000" });
  await expect(
    page.getByText("Merci de renseigner un numéro de téléphone valide")
  ).toBeVisible();

  // Valid
  await updatePhoneNbr(page, { phone: "+33600000000" });
  await testAccountInfo(page, { phone: "+33600000000" });

  // Empty field
  await updatePhoneNbr(page, { phone: "" });
  // TODO: does not work because have to validate twice (bug)
  await testAccountInfo(page, { phone: "" });
};
