import { addToMailQueue } from "../../../../queue/producers/mail";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { Mutation } from "../../../../generated/graphql/types";

const INVITE_USER_TO_COMPANY = `
  mutation InviteUserToCompany($email: String!, $siret: String!, $role: UserRole!){
    inviteUserToCompany(email: $email, siret: $siret, role: $role){
      users {
        email
      }
    }
  }
`;

// Intercept mail job creation
jest.mock("../../../../queue/producers/mail");
(addToMailQueue as jest.Mock).mockImplementation(jest.fn());

beforeEach(() => {
  (addToMailQueue as jest.Mock).mockClear();
});

describe("mutation inviteUserToCompany", () => {
  afterAll(resetDatabase);

  test("admin user can invite existing user to company", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "inviteUserToCompany">>(
      INVITE_USER_TO_COMPANY,
      {
        variables: { email: user.email, siret: company.siret, role: "MEMBER" }
      }
    );
    expect(data.inviteUserToCompany.users!.length).toBe(2);
    expect(data.inviteUserToCompany.users).toEqual(
      expect.arrayContaining([{ email: admin.email }, { email: user.email }])
    );
    const companyAssociations = await prisma.user
      .findUniqueOrThrow({ where: { id: user.id } })
      .companyAssociations();
    expect(companyAssociations).toHaveLength(1);
    expect(companyAssociations[0].role).toEqual("MEMBER");

    // when invited user was already on TD, `automaticallyAccepted` is true
    expect(companyAssociations[0].automaticallyAccepted).toEqual(true);
    expect(companyAssociations[0].createdAt).toBeTruthy();

    const userCompany = await prisma.companyAssociation
      .findUniqueOrThrow({
        where: {
          id: companyAssociations[0].id
        }
      })
      .company();
    expect(userCompany?.siret).toEqual(company.siret);
    expect(userCompany?.siret).toEqual(company.siret);
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
    const hashes = await prisma.userAccountHash.findMany({
      where: { email: invitedUserEmail, companySiret: company.siret! }
    });
    expect(hashes.length).toEqual(1);

    // Check email was sent
    const hashValue = hashes[0].hash;

    // Check that the job was added to the queue
    expect(addToMailQueue as jest.Mock as jest.Mock<any>).toHaveBeenCalledTimes(
      1
    );

    const addJobArgs: any = (addToMailQueue as jest.Mock).mock.calls[0];

    // the right payload
    expect(addJobArgs[0]).toMatchObject({
      subject: "Vous avez été invité à rejoindre Trackdéchets",
      templateId: 9,
      to: [{ email: "newuser@example.test", name: "newuser@example.test" }],
      vars: {
        API_URL: "http://api.trackdechets.local",
        UI_URL: "http://trackdechets.local",
        companyName: "company_2",
        companyOrgId: company.siret,
        hash: encodeURIComponent(hashValue)
      }
    });
    expect(addJobArgs[0].body).toContain(
      `vous a invité à rejoindre\n  Trackdéchets`
    );
    expect(addJobArgs[0].body).toContain(
      `<a href=\"http://trackdechets.local/invite?hash=${encodeURIComponent(
        hashValue
      )}\">`
    );
  });
});
