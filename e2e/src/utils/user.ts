import { Page, expect } from "@playwright/test";
import { prisma } from "@td/prisma";
import { goTo } from "./navigation";
import { setTimeout } from "node:timers/promises";

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
 * Logs a user out.
 */
export const logout = async (page: Page) => {
  await page.getByRole("button", { name: "Se déconnecter" }).click();
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

  // Disconnect button should be visible
  await expect(
    page.getByRole("button", { name: "Se déconnecter" })
  ).toBeVisible();

  return { email, password };
};

/**
 * Will fill the signup form but NOT submit it
 */
export const fillSignupInfo = async (
  page: Page,
  { username, email, password }
) => {
  await goTo(page, "/signup");

  // Name
  await page.getByLabel("Nom et prénom").fill(username);

  // Email
  await page.getByLabel("Email").fill(email);

  // Password
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);

  // Terms
  await page.getByText("Je certifie avoir lu les conditions générales").click();

  return { username, email, password };
};

/**
 * Creates an account with provided credentials. Makes no assertion.
 * Will *not* activate the account via email link.
 */
export const signup = async (page: Page, { username, email, password }) => {
  // Fill the info
  await fillSignupInfo(page, { username, email, password });

  // Try to click on 'create account' button, if enabled
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  return { username, email, password };
};

/**
 * Tests the password policy visual feedback in the signup form
 */
export const testSignupPasswordPolicy = async (page: Page) => {
  // Password is too short
  await fillSignupInfo(page, {
    username: "Username",
    email: "user@mail.com",
    password: "aa"
  });
  await expect(page.getByRole("heading", { name: "Trop court" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer mon compte" })
  ).toBeDisabled();

  // Password is too weak
  await fillSignupInfo(page, {
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
  await fillSignupInfo(page, {
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
 * Will create, activate and log a user in, all at once
 */
export const signupActivateAndLogin = async (
  page: Page,
  { username, email, password }
) => {
  await successfulSignup(page, { username, email, password });
  await activateUser(page, { email });
  await successfulLogin(page, { email, password });
};

/**
 * Will navigate to the account page and verify that account data is accurate.
 * You can pass any of the input params to check them separately.
 */
interface TestAccountInfoProps {
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
}
export const testAccountInfo = async (
  page: Page,
  { email, username, phone, password }: TestAccountInfoProps
) => {
  // Go to account page
  await goTo(page, "/account/info");

  // Verify account data
  if (email) await expect(page.getByText(`Email${email}`)).toBeVisible();
  if (username)
    await expect(page.getByText(`Nom utilisateur${username}`)).toBeVisible();
  if (phone) await expect(page.getByText(`Téléphone${phone}`)).toBeVisible();
  if (password)
    await expect(page.getByText(`Mot de passe${password}`)).toBeVisible();

  return { email, username, phone };
};

/**
 * Modifies the username on the account page. Does not make any assertion.
 */
export const updateUsername = async (page, { username }) => {
  // Go to account page
  await goTo(page, "/account/info");

  const updateUsernameInput = page
    .locator("text=Nom utilisateur")
    .locator("..")
    .locator('div:has-text("Modifier")');

  // If we are not already editing the username, click on Modify
  if (await updateUsernameInput.isVisible()) {
    await updateUsernameInput.click();
  }

  // Modify
  await page.getByPlaceholder("Nom utilisateur").fill(username);

  // Validate
  await page.getByRole("button", { name: "Valider" }).click();
};

/**
 * Tests the username input.
 */
export const testUsernameUpdate = async page => {
  // Valid username
  await updateUsername(page, { username: "User e2e n°1 (modifié)" });
  await testAccountInfo(page, { username: "User e2e n°1 (modifié)" });
};

/**
 * Modifies the phone number on the account page. Does not make any assertion.
 */
export const updatePhoneNbr = async (page, { phone }) => {
  // Go to account page
  await goTo(page, "/account/info");

  const updatePhoneInput = page.getByPlaceholder("Téléphone");
  if (!(await updatePhoneInput.isVisible())) {
    // Click on the button to modify phone number. Tricky: can either
    // be labelled "Ajouter" or "Modifier", and is a div, not a button
    await page
      .locator("text=Téléphone")
      .locator("..")
      .locator('div:has-text("Ajouter"), div:has-text("Modifier")')
      .click();
  }

  // Fill in new phone number and validate
  await page.getByPlaceholder("Téléphone").fill(phone);

  const validatePhoneInput = page.getByRole("button", { name: "Valider" });
  await validatePhoneInput.click();

  // TODO: fix the bug! Sometimes we have to submit twice...
  await setTimeout(500);
  if (await validatePhoneInput.isVisible()) {
    await validatePhoneInput.click();
  }
};

/**
 * Tests the validation on the phone input, with invalid and valid phone numbers.
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
  await testAccountInfo(page, { phone: "" });
};

/**
 * Modifies the password on the account page. Does not make any assertion.
 */
export const updatePassword = async (
  page,
  { oldPassword, newPassword, confirmNewPassword }
) => {
  // Go to account page
  await goTo(page, "/account/info");

  const updatePasswordInput = page
    .locator("text=Mot de passe")
    .locator("..")
    .locator('div:has-text("Modifier")');

  // If we are not already editing the password, click on Modify
  if (await updatePasswordInput.isVisible()) {
    await updatePasswordInput.click();
  }

  // Old password
  await page.getByLabel("Ancien mot de passe:").fill(oldPassword);

  // New password
  await page
    .getByLabel("Nouveau mot de passe:", { exact: true })
    .fill(newPassword);

  // Confirm new password
  await page
    .getByLabel("Confirmation du nouveau mot de passe:")
    .fill(confirmNewPassword);

  const validatePasswordInput = page.getByRole("button", { name: "Valider" });
  await validatePasswordInput.click();

  // TODO: fix the bug! Sometimes we have to submit twice...
  await setTimeout(500);
  if (await validatePasswordInput.isVisible()) {
    await validatePasswordInput.click();
  }
};

/**
 * Tests the validation on the phone input, with invalid and valid phone numbers.
 * Will ultimately try to save the passed 'password' input
 */
export const testPasswordUpdate = async (
  page,
  { oldPassword, newPassword }
) => {
  // Old password is incorrect
  await updatePassword(page, {
    oldPassword: oldPassword + "e",
    newPassword,
    confirmNewPassword: newPassword
  });
  await expect(
    page.getByText("L'ancien mot de passe est incorrect")
  ).toBeVisible();

  // New password is not strong enough
  await updatePassword(page, {
    oldPassword,
    newPassword: "123456789",
    confirmNewPassword: "123456789"
  });
  await expect(
    page.getByText(
      "Votre mot de passe est trop court (9 caractères), la longueur minimale est de 10 caractères"
    )
  ).toBeVisible();

  // New password & confirmation don't match
  await updatePassword(page, {
    oldPassword,
    newPassword,
    confirmNewPassword: newPassword + "e"
  });
  await expect(
    page.getByText("Les deux mots de passe ne sont pas identiques.")
  ).toBeVisible();

  // Valid
  await updatePassword(page, {
    oldPassword,
    newPassword,
    confirmNewPassword: newPassword
  });
  await testAccountInfo(page, { password: "**********" });
};
