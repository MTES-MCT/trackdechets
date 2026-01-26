import { addToMailQueue } from "../../../../queue/producers/mail";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory,
  companyFactory,
  adminFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import type { Mutation } from "@td/codegen-back";
import { ErrorCode, NotCompanyAdminErrorMsg } from "../../../../common/errors";
import { UserRole } from "@td/prisma";
import { templateIds } from "@td/mail";
import { getDefaultNotifications } from "../../../notifications";

const INVITE_USER_TO_COMPANY = `
  mutation InviteUserToCompany($email: String!, $siret: String!, $role: UserRole!){
    inviteUserToCompany(email: $email, siret: $siret, role: $role){
      users {
        email
        isActive
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

  test.each([
    UserRole.ADMIN,
    UserRole.MEMBER,
    UserRole.READER,
    UserRole.DRIVER
  ])(
    "admin user can invite existing user to company with role %p",
    async role => {
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");
      const user = await userFactory();
      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "inviteUserToCompany">>(
        INVITE_USER_TO_COMPANY,
        {
          variables: { email: user.email, siret: company.siret, role }
        }
      );
      expect(data.inviteUserToCompany.users!.length).toBe(2);
      expect(data.inviteUserToCompany.users).toEqual(
        expect.arrayContaining([
          { email: admin.email, isActive: true },
          { email: user.email, isActive: true }
        ])
      );
      const companyAssociations = await prisma.user
        .findUniqueOrThrow({ where: { id: user.id } })
        .companyAssociations();
      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);

      // when invited user was already on TD, `automaticallyAccepted` is true
      expect(companyAssociations[0].automaticallyAccepted).toEqual(true);
      expect(companyAssociations[0].createdAt).toBeTruthy();

      const expectedEmailNotification = getDefaultNotifications(role);

      expect(companyAssociations[0]).toMatchObject(expectedEmailNotification);

      const userCompany = await prisma.companyAssociation
        .findUniqueOrThrow({
          where: {
            id: companyAssociations[0].id
          }
        })
        .company();
      expect(userCompany?.siret).toEqual(company.siret);
      expect(userCompany?.siret).toEqual(company.siret);
    }
  );

  test("aisActive should be null to prevent enumeration", async () => {
    // Given
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");

    // When
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const { data, errors } = await mutate<
      Pick<Mutation, "inviteUserToCompany">
    >(INVITE_USER_TO_COMPANY, {
      variables: {
        email: "test@mail.com",
        siret: company.siret,
        role: UserRole.MEMBER
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(
      data.inviteUserToCompany.users!.find(u => u.email === "test@mail.com")
        ?.isActive
    ).toBe(null);
  });

  test.each([
    UserRole.ADMIN,
    UserRole.MEMBER,
    UserRole.READER,
    UserRole.DRIVER
  ])(
    "admin user can invite a new user to a company with role %p",
    async role => {
      // set up an user, a company, its admin and an invitation (UserAccountHash)
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");

      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

      // Call the mutation to send an invitation
      const invitedUserEmail = "newuser@example.test";
      await mutate(INVITE_USER_TO_COMPANY, {
        variables: {
          email: invitedUserEmail,
          siret: company.siret,
          role
        }
      });

      // Check userAccountHash has been successfully created
      const hashes = await prisma.userAccountHash.findMany({
        where: { email: invitedUserEmail, companySiret: company.siret! }
      });
      expect(hashes.length).toEqual(1);

      expect(hashes[0].role).toEqual(role);

      // Check email was sent
      const hashValue = hashes[0].hash;

      // Check that the job was added to the queue
      expect(
        addToMailQueue as jest.Mock as jest.Mock<any>
      ).toHaveBeenCalledTimes(1);

      const addJobArgs: any = (addToMailQueue as jest.Mock).mock.calls[0];

      // the right payload
      expect(addJobArgs[0]).toMatchObject({
        subject: "Vous avez été invité à rejoindre Trackdéchets",
        templateId: templateIds.LAYOUT,
        to: [{ email: "newuser@example.test", name: "newuser@example.test" }],
        vars: {
          API_URL: "http://api.trackdechets.local",
          UI_URL: "http://trackdechets.local",
          companyName: company.name,
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
    }
  );

  test("TD admin user can invite a new user to a company", async () => {
    const company = await companyFactory();
    const tdAdminUser = await adminFactory();
    const { mutate } = makeClient({ ...tdAdminUser, auth: AuthType.Session });

    // Call the mutation to send an invitation
    const invitedUserEmail = "newuser2@example.test";
    await mutate(INVITE_USER_TO_COMPANY, {
      variables: {
        email: invitedUserEmail,
        siret: company.siret,
        role: "ADMIN"
      }
    });
    // Check userAccountHash has been successfully created
    const hashes = await prisma.userAccountHash.findMany({
      where: { email: invitedUserEmail, companySiret: company.siret! }
    });
    expect(hashes.length).toEqual(1);
  });

  test("user who isn't an admin of a company can't invite a new user to a company", async () => {
    const company = await companyFactory();
    const notAdminUser = await userFactory({
      isAdmin: false
    });
    const { mutate } = makeClient({ ...notAdminUser, auth: AuthType.Session });

    // Call the mutation to send an invitation
    const invitedUserEmail = "newuser3@example.test";
    const { errors } = await mutate(INVITE_USER_TO_COMPANY, {
      variables: {
        email: invitedUserEmail,
        siret: company.siret,
        role: "ADMIN"
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: NotCompanyAdminErrorMsg(company.orgId),
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
});
