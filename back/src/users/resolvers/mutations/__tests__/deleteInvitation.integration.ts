import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { createUserAccountHash } from "../../../database";
import { Mutation } from "../../../../generated/graphql/types";

const DELETE_INVITATION = `
  mutation DeleteInvitation($email: String!, $siret: String!){
    deleteInvitation(email: $email, siret: $siret) {
      users {
        email
      }
    }
  }
`;

describe("mutation deleteInvitation", () => {
  afterEach(resetDatabase);

  it("should delete a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = await userFactory();
    const accountHash = await createUserAccountHash(
      usrToInvite.email,
      "MEMBER",
      company.siret!
    );

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    // Call the mutation to delete the invitation
    const { data } = await mutate<Pick<Mutation, "deleteInvitation">>(
      DELETE_INVITATION,
      {
        variables: { email: usrToInvite.email, siret: company.siret }
      }
    );

    // Check invitation has been successfully deleted
    const userAccountHashExists =
      (await prisma.userAccountHash.findFirst({
        where: {
          id: accountHash.id
        }
      })) != null;
    expect(userAccountHashExists).toBeFalsy();
    expect(data.deleteInvitation.users!.length).toBe(1);
  });

  it("should throw error if invitation does not exist", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    const { errors } = await mutate(DELETE_INVITATION, {
      variables: { email: user.email, siret: company.siret }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  test("TD admin user can delete a pending invitation", async () => {
    const company = await companyFactory();
    const usrToInvite = "john.snow@trackdechets.fr";
    const accountHash = await createUserAccountHash(
      usrToInvite,
      "MEMBER",
      company.siret!
    );
    const tdAdminUser = await userFactory({
      isAdmin: true
    });
    const { mutate } = makeClient({ ...tdAdminUser, auth: AuthType.Session });
    // Call the mutation to delete the invitation
    const { data } = await mutate<Pick<Mutation, "deleteInvitation">>(
      DELETE_INVITATION,
      {
        variables: { email: usrToInvite, siret: company.siret }
      }
    );

    // Check invitation has been successfully deleted
    const userAccountHashExists =
      (await prisma.userAccountHash.findFirst({
        where: {
          id: accountHash.id
        }
      })) != null;
    expect(userAccountHashExists).toBeFalsy();
    expect(data.deleteInvitation.users!.length).toBe(0);
  });
});
