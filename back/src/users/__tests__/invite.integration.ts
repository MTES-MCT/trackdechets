import { prisma } from "../../generated/prisma-client";
import { createUserAccountHash } from "../mutations/createUserAccountHash";

import { server } from "../../server";
import { createTestClient } from "apollo-server-integration-testing";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import { escape } from "querystring";
import axios from "axios";

import { escape } from "querystring";
import axios from "axios";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import { resetDatabase } from "../../../integration-tests/helper";

// Intercept mail calls
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue({} as any);

beforeEach(() => {
  mockedAxiosPost.mockClear();
});

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

    const { mutate } = makeClient(admin);

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
});

describe("Invitation resend", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should resend a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = await userFactory();
    const accountHash = await createUserAccountHash(
      usrToInvite.email,
      "MEMBER",
      company.siret
    );

    const { mutate } = makeClient(admin);

    // Call the mutation to resend the invitation

    const mutation = `
        mutation {
          resendInvitation(email: "${usrToInvite.email}", siret: "${company.siret}")
        }
      `;
    const res = await mutate(mutation);

    expect(res).toEqual({ data: { resendInvitation: true } });
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const postArgs = mockedAxiosPost.mock.calls[0];

    expect(postArgs[0]).toEqual("http://td-mail/send");

    //  Check To
    expect(postArgs[1].to[0].email).toEqual(usrToInvite.email);
    expect(postArgs[1].subject).toContain(
      "Vous avez été invité à rejoindre Trackdéchets"
    );

    expect(postArgs[1].body).toContain(
      "vous a invité à rejoindre Trackdéchets"
    );
    expect(postArgs[1].body).toContain(company.name);
  });
});

describe("Invitation sending", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should send a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(admin);

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
