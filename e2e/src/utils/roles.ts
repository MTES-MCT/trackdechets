import { goTo } from "./navigation";
import { getCompanyDiv } from "./company";
import { expect } from "@playwright/test";
import { prisma } from "@td/prisma";

/**
 * Enables to invite a user to a company
 */
type Role = "Collaborateur" | "Administrateur" | "Lecteur" | "Chauffeur";
export const sendMembershipRequest = async (
  page,
  {
    company,
    user,
    role
  }: {
    company: { id: string; siret: string; name: string };
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
  await expect(memberDiv.getByText("Invité")).toBeVisible();
  await expect(memberDiv.getByText("Invitation en attente")).toBeVisible();

  // If user has an ID, he has an account in TD.
  // Let's find the membership request data in the DB
  if (user.id) {
    const request = await prisma.membershipRequest.findFirst({
      where: {
        userId: user.id,
        companyId: company.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(request).not.toBeUndefined();

    return request;
  }
};
