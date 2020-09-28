import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import { createUserAccountHash } from "../../../database";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { prisma } from "../../../../generated/prisma-client";
import { ErrorCode } from "../../../../common/errors";

describe("mutation deleteInvitation", () => {
  afterEach(resetDatabase);

  it("should delete a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = await userFactory();
    const accountHash = await createUserAccountHash(
      usrToInvite.email,
      "MEMBER",
      company.siret
    );

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    // Call the mutation to delete the invitation
    // We pass company siret to allow permission to check requiring user is one admin of this company
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
  });

  it("should throw error if invitation does not exist", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    const mutation = `
        mutation {
          deleteInvitation(email: "${user.email}", siret: "${company.siret}") {
            id
          }
        }
      `;
    const { errors } = await mutate(mutation);
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });
});
