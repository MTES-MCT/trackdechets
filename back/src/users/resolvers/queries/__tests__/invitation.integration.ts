import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const INVITATION = `
  query Invitation($hash: String!){
    invitation(hash: $hash){
      email
      companySiret
      role
      acceptedAt
    }
  }
`;

describe("query / invitation", () => {
  afterEach(resetDatabase);

  it("should return an invitation by hash", async () => {
    const { query } = makeClient();
    const userAccountHash = await prisma.createUserAccountHash({
      email: "john.snow@trackdechets.fr",
      companySiret: "11111111111111",
      hash: "azerty",
      role: "MEMBER"
    });
    const { data } = await query(INVITATION, {
      variables: { hash: userAccountHash.hash }
    });
    expect(data.invitation.email).toEqual(userAccountHash.email);
    expect(data.invitation.companySiret).toEqual(userAccountHash.companySiret);
    expect(data.invitation.role).toEqual(userAccountHash.role);
    expect(data.invitation.email).toEqual(userAccountHash.email);
  });

  it("should return error if invitation does not exist", async () => {
    const { query } = makeClient();
    const { errors } = await query(INVITATION, {
      variables: { hash: "does_not_exist" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should silently join company if user already exists", async () => {
    const user = await userFactory();
    const company = await companyFactory();
    const userAccountHash = await prisma.createUserAccountHash({
      email: user.email,
      companySiret: company.siret,
      hash: "azerty",
      role: "MEMBER",
      acceptedAt: null
    });
    const { query } = makeClient();
    const { data } = await query(INVITATION, {
      variables: { hash: userAccountHash.hash }
    });
    expect(data.invitation.acceptedAt.length).toBeGreaterThan(0);
    const joined = await prisma.$exists.companyAssociation({
      user: { id: user.id },
      company: { siret: company.siret }
    });
    expect(joined).toEqual(true);
  });

  it(
    "should silently mark an invitation as joined if user " +
      "and company association already exist",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const userAccountHash = await prisma.createUserAccountHash({
        email: user.email,
        companySiret: company.siret,
        hash: "azerty",
        role: "MEMBER",
        acceptedAt: null
      });
      const { query } = makeClient();
      const { data } = await query(INVITATION, {
        variables: { hash: userAccountHash.hash }
      });
      expect(data.invitation.acceptedAt.length).toBeGreaterThan(0);
    }
  );
});
