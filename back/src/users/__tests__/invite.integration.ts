import { prisma } from "../../generated/prisma-client";
import { createUserAccountHash } from "../mutations/createUserAccountHash";
import { resetDatabase } from "../../../integration-tests/helper";

import { server } from "../../server";
import { createTestClient } from "apollo-server-integration-testing";
import { sign } from "jsonwebtoken";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
const { JWT_SECRET } = process.env;

describe("Invitation removal", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should delete a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = await userFactory();
    const accountHash = await createUserAccountHash(
      usrToInvite.email,
      "MEMBER",
      company.siret
    );

    // instantiate test client
    const { mutate, setOptions } = createTestClient({
      apolloServer: server
    });

    // Generate and pass token into Auth header
    const token = sign({ userId: admin.id }, JWT_SECRET, { expiresIn: "1d" });
    setOptions({
      request: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Call the mutation to delete the invitation
    // We pass company siret to allow permission to check requiring user is one admin fo this company
    const mutation = `
        mutation {
          deleteInvitation(email: "${usrToInvite.email}", siret: "${company.siret}") {
            id
          }
        }
      `;
    await mutate(mutation);

    // Check invitation has been successfully deleted
    const userAccountHashExists = await prisma.$exists.userAccountHash({
      id: accountHash.id
    });
    expect(userAccountHashExists).toBeFalsy();

    const assoc = await prisma.user({ id: admin.id }).companyAssociations();
  });
});
