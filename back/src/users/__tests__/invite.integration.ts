import { prisma } from "../../generated/prisma-client";
import { createUserAccountHash } from "../mutations/createUserAccountHash";
import { resetDatabase } from "../../../integration-tests/helper";

import { server } from "../../server";
import { createTestClient } from "apollo-server-integration-testing";
import { sign } from "jsonwebtoken";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import { escape } from "querystring";
import axios from "axios";

const { JWT_SECRET } = process.env;

// Intercept mail calls
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue({} as any);

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

describe("Invitation sending", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should send a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");

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

    // Call the mutation to send an invitation
    const invitedUserEmail = "newuser@example.test";
    const mutation = `
      mutation   {
        inviteUserToCompany(email: "${invitedUserEmail}", siret: "${company.siret}", role: MEMBER) {
          id
        }
      }
    `;
    const res = await mutate(mutation);

    // Check userAccountHash has been successfully created
    const hashes = await prisma.userAccountHashes({
      where: { email: invitedUserEmail, companySiret: company.siret }
    });
    expect(hashes.length).toEqual(1);

    // Check email was sent
    const hashValue = hashes[0].hash;

    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const postArgs = mockedAxiosPost.mock.calls[0];
    // to right endpoint
    expect(postArgs[0]).toEqual("http://td-mail/send");

    // to right person
    expect(postArgs[1].to[0].email).toEqual(invitedUserEmail);
    // With right text
    expect(postArgs[1].subject).toContain(
      "Vous avez été invité à rejoindre Trackdéchets"
    );

    expect(postArgs[1].body).toContain(
      "vous a invité à rejoindre Trackdéchets"
    );
    // Dnd right hash value
    expect(postArgs[1].body).toContain(escape(hashValue));
  });
});
