import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  getActiveAdminsByCompanyIds,
  getCompanyInvitedUsers
} from "../database";
import { createUserDataLoaders } from "../../users/dataloaders";
import { AppDataloaders } from "../../types";

const dataloaders = createUserDataLoaders() as AppDataloaders;

describe("getInvitedUsers", () => {
  afterAll(resetDatabase);

  it("should not return a user who has already joined", async () => {
    const company = await companyFactory();
    await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: company.siret!,
        hash: "hash1",
        role: "MEMBER",
        acceptedAt: new Date(),
        expiresAt: new Date()
      }
    });
    const invitedUsers = await getCompanyInvitedUsers(
      company.siret!,
      dataloaders
    );
    expect(invitedUsers).toEqual([]);
  });

  it("should return list of invited users", async () => {
    const company = await companyFactory();
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: company.siret!,
        hash: "hash2",
        role: "MEMBER",
        expiresAt: new Date()
      }
    });
    const invitedUsers = await getCompanyInvitedUsers(
      company.siret!,
      dataloaders
    );
    expect(invitedUsers).toHaveLength(1);
    expect(invitedUsers[0]).toMatchObject({
      email: invitation.email,
      isPendingInvitation: true,
      name: "Invité",
      role: invitation.role
    });
  });
});

describe("getActiveAdminsByCompanyIds", () => {
  it("should return active admins belonging to companies", async () => {
    // Should be returned
    const userAndCompany0 = await userWithCompanyFactory("ADMIN");

    // Should be returned
    const userAndCompany1 = await userWithCompanyFactory("ADMIN");

    // Should not be returned, cause not active
    const userAndCompany2 = await userWithCompanyFactory(
      "ADMIN",
      {},
      { isActive: false }
    );

    // Should not be returned, cause not admin
    const userAndCompany3 = await userWithCompanyFactory("MEMBER");

    // Should not be returned, cause not in query
    await userWithCompanyFactory("ADMIN");

    // Should not return any admin as no user is member of company
    const company = await companyFactory();

    const result = await getActiveAdminsByCompanyIds([
      userAndCompany0.company.id,
      userAndCompany1.company.id,
      userAndCompany2.company.id,
      userAndCompany3.company.id,
      company.id
    ]);

    expect(Object.keys(result).length).toEqual(2);
    expect(Object.keys(result).sort()).toEqual([
      userAndCompany0.company.id,
      userAndCompany1.company.id
    ]);
    expect(result[userAndCompany0.company.id][0].id).toEqual(
      userAndCompany0.user.id
    );
    expect(result[userAndCompany1.company.id][0].id).toEqual(
      userAndCompany1.user.id
    );
  });
});
