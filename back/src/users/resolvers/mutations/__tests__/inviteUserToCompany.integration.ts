import axios from "axios";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { AuthType } from "../../../../auth";

const INVITE_USER_TO_COMPANY = `
  mutation InviteUserToCompany($email: String!, $siret: String!, $role: UserRole!){
    inviteUserToCompany(email: $email, siret: $siret, role: $role){
      users {
        email
      }
    }
  }
`;

// Intercept mail calls
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue({} as any);
beforeEach(() => {
  mockedAxiosPost.mockClear();
});

describe("mutation inviteUserToCompany", () => {
  afterAll(resetDatabase);

  test("admin user can invite existing user to company", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await mutate(INVITE_USER_TO_COMPANY, {
      variables: { email: user.email, siret: company.siret, role: "MEMBER" }
    });
    expect(data.inviteUserToCompany.users).toEqual([
      { email: admin.email },
      { email: user.email }
    ]);
    const companyAssociations = await prisma
      .user({ id: user.id })
      .companyAssociations();
    expect(companyAssociations).toHaveLength(1);
    expect(companyAssociations[0].role).toEqual("MEMBER");
    const userCompany = await prisma
      .companyAssociation({
        id: companyAssociations[0].id
      })
      .company();
    expect(userCompany.siret).toEqual(company.siret);
  });

  test("admin user can invite a new user to a company", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    // Call the mutation to send an invitation
    const invitedUserEmail = "newuser@example.test";
    await mutate(INVITE_USER_TO_COMPANY, {
      variables: {
        email: invitedUserEmail,
        siret: company.siret,
        role: "MEMBER"
      }
    });

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
    expect(postArgs[0]).toEqual("http://mailservice/smtp/email");

    // to right person
    expect(postArgs[1].to[0].email).toEqual(invitedUserEmail);
    // With right text
    expect(postArgs[1].subject).toContain(
      "Vous avez été invité à rejoindre Trackdéchets"
    );

    expect(postArgs[1].params.body).toContain(
      "vous a invité à rejoindre Trackdéchets"
    );
    // Dnd right hash value
    expect(postArgs[1].params.body).toContain(encodeURIComponent(hashValue));
  });
});
