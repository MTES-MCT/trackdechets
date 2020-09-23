import { resetDatabase } from "../../../../../integration-tests/helper";
import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../../../../server";
import { prisma } from "../../../../generated/prisma-client";
import { companyFactory } from "../../../../__tests__/factories";
import { getUserCompanies } from "../../../database";
import makeClient from "../../../../__tests__/testClient";

const JOIN_WITH_INVITE = `
  mutation JoinWithInvite($inviteHash: String!, $name: String!, $password: String!){
    joinWithInvite(inviteHash: $inviteHash, name: $name, password: $password){
      email
    }
  }
`;

describe("joinWithInvite mutation", () => {
  afterEach(resetDatabase);
  const { mutate } = makeClient();

  it("should raise exception if invitation does not exist", async () => {
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: { inviteHash: "invalid", name: "John Snow", password: "pass" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should raise exception if invitation was already accepted", async () => {
    const { mutate } = createTestClient({ apolloServer: server });

    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.createUserAccountHash({
      email: invitee,
      companySiret: company.siret,
      role: "MEMBER",
      hash: "hash",
      acceptedAt: new Date().toISOString()
    });
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "pass"
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation a déjà été acceptée");
  });

  it("should create user, associate it to company and mark invitation as joined", async () => {
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.createUserAccountHash({
      email: invitee,
      companySiret: company.siret,
      role: "MEMBER",
      hash: "hash"
    });

    const { data } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "pass"
      }
    });

    expect(data.joinWithInvite.email).toEqual(invitee);

    // should mark invitation as joined
    const updatedInvitation = await prisma.userAccountHash({
      id: invitation.id
    });
    expect(updatedInvitation.acceptedAt.length).toBeGreaterThan(0);

    // check invitee is company member
    const isCompanyMember = await prisma.$exists.companyAssociation({
      user: { email: invitee },
      company: { siret: company.siret }
    });
    expect(isCompanyMember).toEqual(true);
  });

  it("should accept other pending invitations", async () => {
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation1 = await prisma.createUserAccountHash({
      email: invitee,
      companySiret: company1.siret,
      role: "MEMBER",
      hash: "hash1"
    });

    const invitation2 = await prisma.createUserAccountHash({
      email: invitee,
      companySiret: company2.siret,
      role: "MEMBER",
      hash: "hash2"
    });

    await mutate(JOIN_WITH_INVITE, {
      variables: {
        name: "John Snow",
        inviteHash: invitation1.hash,
        password: "pass"
      }
    });

    const updatedInvitation2 = await prisma.userAccountHash({
      id: invitation2.id
    });
    expect(updatedInvitation2.acceptedAt.length).toBeGreaterThan(0);

    const user = await prisma.user({ email: invitee });
    const companies = await getUserCompanies(user.id);

    expect(companies.length).toEqual(2);
    expect(companies.map(c => c.siret)).toEqual([
      company1.siret,
      company2.siret
    ]);
  });
});
