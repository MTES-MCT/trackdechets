import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
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
        companySiret: "11111111111111",
        hash: "azerty",
        role: "MEMBER"
      }
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
});
