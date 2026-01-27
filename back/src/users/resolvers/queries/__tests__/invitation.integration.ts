import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { siretify } from "../../../../__tests__/factories";
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
    const userAccountHash = await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: siretify(2),
        hash: "azerty",
        role: "MEMBER",
        expiresAt: new Date()
      }
    });
    const { data } = await query<Pick<Query, "invitation">>(INVITATION, {
      variables: { hash: userAccountHash.hash }
    });
    expect(data.invitation!.email).toEqual(userAccountHash.email);
    expect(data.invitation!.companySiret).toEqual(userAccountHash.companySiret);
    expect(data.invitation!.role).toEqual(userAccountHash.role);
    expect(data.invitation!.email).toEqual(userAccountHash.email);
  });

  it("should return error if invitation does not exist", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "invitation">>(INVITATION, {
      variables: { hash: "does_not_exist" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should not return expired invitations", async () => {
    const { query } = makeClient();
    const userAccountHash = await prisma.userAccountHash.create({
      data: {
        email: "expired@trackdechets.fr",
        companySiret: siretify(3),
        hash: "oldhash",
        role: "MEMBER",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    });
    const { errors } = await query<Pick<Query, "invitation">>(INVITATION, {
      variables: { hash: userAccountHash.hash }
    });
    expect(errors).toHaveLength(1);
    expect(errors![0].message).toEqual("Cette invitation n'existe pas");
  });
});
