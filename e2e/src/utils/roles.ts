import { goTo } from "./navigation";
import { getCompanyDiv } from "./company";
import { expect } from "@playwright/test";
import { prisma } from "@td/prisma";

/**
 * Enables to invite a user to a company
 */
type Role = "Collaborateur" | "Administrateur" | "Lecteur" | "Chauffeur";
export const inviteUserToCompany = async (
  page,
  {
    company,
    user,
    role
  }: {
    company: { siret: string; name: string };
    user: { email: string };
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
  await expect(memberDiv.getByText("Invité")).toBeVisible();
  await expect(memberDiv.getByText("Invitation en attente")).toBeVisible();

  // Let's find the membership request hash in the DB
  const hash = await prisma.userAccountHash.findFirst({
    where: {
      email: user.email,
      companySiret: company.siret
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  expect(hash).not.toBeNull();

  return hash;
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
  const hash = await prisma.userAccountHash.findFirst({
    where: {
      email: user.email,
      companySiret: company.siret
    },
    orderBy: {
      createdAt: "desc"
    }
  });

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
