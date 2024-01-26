import { goTo } from "./navigation";
import { getCompanyDiv } from "./company";
import { expect } from "@playwright/test";
import { getUserAccountHash } from "../data/userAccountHash";
import { getCompanyAssociation } from "../data/company";

/**
 * Enables to invite a user to a company. Specify user.id & company.id
 * if invited user is registered in TD
 */
type Role = "Collaborateur" | "Administrateur" | "Lecteur" | "Chauffeur";
export const inviteUserToCompany = async (
  page,
  {
    company,
    user,
    role
  }: {
    company: { id?: string; siret: string; name: string };
    user: { id?: string; email: string };
    role: Role;
  }
) => {
  // Go to companies page
  await goTo(page, "/account/companies");

  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, {
    siret: company.siret,
    name: company.name,
    tab: "Membres"
  });

  // Enter user details
  await companyDiv
    .getByPlaceholder("Email de la personne à inviter")
    .fill(user.email);
  await companyDiv.getByRole("combobox").selectOption(role);
  await companyDiv.getByRole("button", { name: "Inviter" }).click();

  // Toast should confirm invitation sent
  await expect(page.getByText("Invitation envoyée")).toBeVisible();

  // User should now appear in members' list
  const memberDiv = companyDiv
    .getByRole("cell", { name: user.email })
    .locator("..");
  await expect(memberDiv).toBeVisible();
  await expect(memberDiv.getByText(role)).toBeVisible();

  // User is registered on TD
  if (user.id) {
    await expect(memberDiv.getByText("Utilisateur actif")).toBeVisible();
    await expect(memberDiv.getByText("Temporairement masqué")).toBeVisible();
    await expect(
      memberDiv.getByRole("button", { name: "Retirer les droits" })
    ).toBeVisible();
  } else {
    await expect(memberDiv.getByText("Invité")).toBeVisible();
    await expect(memberDiv.getByText("Invitation en attente")).toBeVisible();
  }

  // User is registered on TD
  if (user.id && company.id) {
    // Let's find the company association in the DB
    const association = await getCompanyAssociation(user.id, company.id);
    expect(association).not.toBeNull();

    return association;
  } else {
    // Let's find the userAccountHash hash in the DB
    const hash = await getUserAccountHash(company.siret, user.email);
    expect(hash).not.toBeNull();

    return hash;
  }
};

/**
 * Deletes an invitation
 */
export const deleteInvitation = async (
  page,
  {
    company,
    user
  }: {
    company: { siret: string; name: string };
    user: { email: string };
  }
) => {
  // Go to companies page
  await goTo(page, "/account/companies");

  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, {
    siret: company.siret,
    name: company.name,
    tab: "Membres"
  });

  // Delete user invitation
  const memberDiv = companyDiv
    .getByRole("cell", { name: user.email })
    .locator("..");
  await memberDiv
    .getByRole("button", { name: "Supprimer l'invitation" })
    .click();

  // Toast should confirm success
  await expect(page.getByText("Invitation supprimée")).toBeVisible();

  // Hash should be removed from DB
  const hash = await getUserAccountHash(company.siret, user.email);
  expect(hash).toBeNull();
};

/**
 * Visits an invitation a link and will assert that it results in an error
 */
export const visitExpiredInvitationLink = async (page, { hash }) => {
  // Go to link
  goTo(page, `/invite?hash=${encodeURIComponent(hash)}`);

  // Assert error
  await expect(
    page.getByText("ErreurCette invitation n'existe pas")
  ).toBeVisible();
};

/**
 * Visits an invitation link as a non-registered user
 */
export const visitInvitationLinkAsNonRegisteredUser = async (
  page,
  { hash, email }
) => {
  // Go to link
  goTo(page, `/invite?hash=${encodeURIComponent(hash)}`);

  // Email field should already be filled
  const emailInputValue = await page.getByLabel("Email").inputValue();
  expect(emailInputValue).toEqual(email);
};

/**
 * Re-sends an invitation to a pending company member
 */
export const resendInvitation = async (
  page,
  {
    company,
    user
  }: {
    company: { siret: string; name: string };
    user: { email: string };
  }
) => {
  // Go to companies page
  await goTo(page, "/account/companies");

  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, {
    siret: company.siret,
    name: company.name,
    tab: "Membres"
  });

  // Re-send invitation
  const memberDiv = companyDiv
    .getByRole("cell", { name: user.email })
    .locator("..");
  await memberDiv
    .getByRole("button", { name: "Renvoyer l'invitation" })
    .click();

  // Toast should confirm success
  await expect(page.getByText("Invitation renvoyée")).toBeVisible();

  // Return the membership request hash in the DB
  const hash = await getUserAccountHash(company.siret, user.email);
  expect(hash).not.toBeNull();

  return hash;
};

/**
 * Verifies that a user has the expected access to a company,
 * with the correct role
 */
export const verifyCompanyAccess = async (
  page,
  {
    company,
    user,
    role
  }: {
    company: { name: string; siret: string };
    user: { email: string };
    role: Role;
  }
) => {
  // Go to companies page
  await goTo(page, "/account/companies");

  // User should see the company
  const companyDiv = await getCompanyDiv(page, {
    siret: company.siret,
    name: company.name,
    tab: "Membres"
  });

  // User should now appear in members' list, with correct role
  const memberDiv = companyDiv
    .getByRole("cell", { name: user.email })
    .locator("..");
  await expect(memberDiv).toBeVisible();
  await expect(memberDiv.getByText(role)).toBeVisible();
};

/**
 * Revoke user's access to a company
 */
export const revokeAccess = async (
  page,
  {
    company,
    user
  }: {
    company: { id: string; name: string; siret: string };
    user: { id: string; email: string };
  }
) => {
  // Go to companies page
  await goTo(page, "/account/companies");

  // User should see the company
  const companyDiv = await getCompanyDiv(page, {
    siret: company.siret,
    name: company.name,
    tab: "Membres"
  });

  // User should be in members' list
  const memberDiv = companyDiv
    .getByRole("cell", { name: user.email })
    .locator("..");
  await memberDiv.getByRole("button", { name: "Retirer les droits" }).click();

  // Member should no longer be visible
  await expect(memberDiv).not.toBeVisible();

  // Company association should be removed from DB
  const association = await getCompanyAssociation(user.id, company.id);
  expect(association).toBeNull();
};
