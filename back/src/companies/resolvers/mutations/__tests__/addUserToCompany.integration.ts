import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  MutationAddUserToCompanyArgs,
  Mutation
} from "../../../../generated/graphql/types";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";

const ADD_USER_TO_COMPANY = gql`
  mutation AddUserToCompany($input: AddUserToCompanyInput!) {
    addUserToCompany(input: $input)
  }
`;

describe("mutation addUserToCompany", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    const user = await userFactory({ isAdmin: false });
    const { query } = makeClient(user);
    const { errors } = await query(ADD_USER_TO_COMPANY, {
      variables: {
        input: { email: "t@t.fr", role: "ADMIN", orgId: "XXXXXXXXXXXXXX" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("fail if the company does not exist", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { query } = makeClient(admin);
    const { errors } = await query(ADD_USER_TO_COMPANY, {
      variables: {
        input: { email: "t@t.fr", role: "ADMIN", orgId: "XXXXXXXXXXXXXX" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'existe pas dans Trackdéchets"
      })
    ]);
  });

  it("fail if the user does not exist", async () => {
    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {},
      {
        isAdmin: true
      }
    );
    const { query } = makeClient(user);
    const { errors } = await query(ADD_USER_TO_COMPANY, {
      variables: {
        input: {
          email: "doesnt@exist.fr",
          role: "ADMIN",
          orgId: company.siret!
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Cet utilisateur n'existe pas" })
    ]);
  });

  it("fail if the user already belongs to the company", async () => {
    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {},
      {
        isAdmin: true
      }
    );
    const { query } = makeClient(user);
    const { errors } = await query(ADD_USER_TO_COMPANY, {
      variables: {
        input: { email: user.email, role: "ADMIN", orgId: company.siret! }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet utilisateur appartient déjà à cette entreprise"
      })
    ]);
  });

  it("should add a user to a company", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const company = await companyFactory();
    const { query } = makeClient(admin);

    await query<
      Pick<Mutation, "addUserToCompany">,
      MutationAddUserToCompanyArgs
    >(ADD_USER_TO_COMPANY, {
      variables: {
        input: { email: user.email, role: "ADMIN", orgId: company.siret! }
      }
    });

    const newCompanyAssociation = await prisma.companyAssociation.findFirst({
      where: { companyId: company.id, userId: user.id }
    });
    expect(newCompanyAssociation).toBeTruthy();
  });
});
