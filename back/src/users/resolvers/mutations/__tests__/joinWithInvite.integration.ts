import { resetDatabase } from "../../../../../integration-tests/helper";
import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../../../../server";
import { prisma } from "../../../../generated/prisma-client";
import { getCompanyUsers } from "../../../../companies/queries";

describe("joinWithInvite mutation", () => {
  afterAll(() => {
    return resetDatabase();
  });

  it("should raise exception if hash does not exist", async () => {
    const { mutate } = createTestClient({ apolloServer: server });
    const mutation = `
      mutation {
        joinWithInvite(inviteHash: "invalid", name: "John Snow", password: "pass"){
          email
        }
      }
    `;
    const { errors } = await mutate(mutation);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette invitation n'est plus valable. Contactez le responsable de votre société."
    );
  });

  it("should create user, associate it to company and delete hash", async () => {
    const { mutate } = createTestClient({ apolloServer: server });

    await prisma.createUserAccountHash({
      email: "john.snow@trackdechets.fr",
      companySiret: "85001946400013",
      role: "MEMBER",
      hash: "hash"
    });

    await prisma.createCompany({
      siret: "85001946400013",
      securityCode: 1234,
      name: "King of the North Inc"
    });

    const mutation = `
      mutation {
        joinWithInvite(inviteHash: "hash", name: "John Snow", password: "pass"){
          email
        }
      }
    `;

    const { data } = await mutate(mutation);

    expect(data.joinWithInvite.email).toEqual("john.snow@trackdechets.fr");

    // should delete hash entry
    const userAccountHashCount = await prisma
      .userActivationHashesConnection()
      .aggregate()
      .count();

    expect(userAccountHashCount).toEqual(0);

    // should create company association
    const users = await getCompanyUsers("85001946400013");
    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual("john.snow@trackdechets.fr");
  });
});
