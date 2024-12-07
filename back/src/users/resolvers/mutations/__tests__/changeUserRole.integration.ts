import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { hash } from "bcrypt";
import { AuthType } from "../../../../auth";
import { Mutation } from "@td/codegen-back";
import { ErrorCode, NotCompanyAdminErrorMsg } from "../../../../common/errors";
import { UserRole } from "@prisma/client";
import { getDefaultNotifications } from "../../../notifications";

const CHANGE_USER_ROLE = `
  mutation ChangeUserRole($userId: ID!, $orgId: ID!, $role: UserRole!){
    changeUserRole(userId: $userId, orgId: $orgId, role: $role){
      email
      role
    }
  }
`;

describe("mutation changeUserRole", () => {
  afterAll(resetDatabase);

  test.each([UserRole.MEMBER, UserRole.READER, UserRole.DRIVER])(
    "admin can change a company user with role ADMIN to role %p",
    async role => {
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");
      const notifications = getDefaultNotifications(UserRole.ADMIN);
      const userToModify = await userFactory({
        companyAssociations: {
          create: {
            company: { connect: { id: company.id } },
            role: UserRole.ADMIN,
            ...notifications
          }
        }
      });

      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
        CHANGE_USER_ROLE,
        {
          variables: {
            userId: userToModify.id,
            orgId: company.orgId,
            role
          }
        }
      );
      expect(data.changeUserRole.email).toEqual(userToModify.email);
      expect(data.changeUserRole.role).toEqual(role);
      const companyAssociations = await prisma.user
        .findUniqueOrThrow({ where: { id: userToModify.id } })
        .companyAssociations();
      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);
      expect(companyAssociations[0]).toMatchObject(
        getDefaultNotifications(companyAssociations[0].role)
      );
    }
  );

  test.each([UserRole.ADMIN, UserRole.READER, UserRole.DRIVER])(
    "admin can change a company user with role MEMBER to role %p",
    async role => {
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");
      const userToModify = await userFactory({
        companyAssociations: {
          create: {
            company: { connect: { id: company.id } },
            role: UserRole.MEMBER,
            ...getDefaultNotifications(UserRole.MEMBER)
          }
        }
      });

      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
        CHANGE_USER_ROLE,
        {
          variables: {
            userId: userToModify.id,
            orgId: company.orgId,
            role
          }
        }
      );
      expect(data.changeUserRole.email).toEqual(userToModify.email);
      expect(data.changeUserRole.role).toEqual(role);
      const companyAssociations = await prisma.user
        .findUniqueOrThrow({ where: { id: userToModify.id } })
        .companyAssociations();
      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);
      expect(companyAssociations[0]).toMatchObject(
        getDefaultNotifications(companyAssociations[0].role)
      );
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.DRIVER])(
    "admin can change a company user with role READER to role %p",
    async role => {
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");
      const userToModify = await userFactory({
        companyAssociations: {
          create: {
            company: { connect: { id: company.id } },
            role: UserRole.READER,
            ...getDefaultNotifications(UserRole.READER)
          }
        }
      });

      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
        CHANGE_USER_ROLE,
        {
          variables: {
            userId: userToModify.id,
            orgId: company.orgId,
            role
          }
        }
      );
      expect(data.changeUserRole.email).toEqual(userToModify.email);
      expect(data.changeUserRole.role).toEqual(role);
      const companyAssociations = await prisma.user
        .findUniqueOrThrow({ where: { id: userToModify.id } })
        .companyAssociations();
      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);
      expect(companyAssociations[0]).toMatchObject(
        getDefaultNotifications(companyAssociations[0].role)
      );
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.READER])(
    "admin can change a company user with role DRIVER to role %p",
    async role => {
      const { user: admin, company } = await userWithCompanyFactory("ADMIN");
      const userToModify = await userFactory({
        companyAssociations: {
          create: {
            company: { connect: { id: company.id } },
            role: UserRole.DRIVER,
            ...getDefaultNotifications(UserRole.DRIVER)
          }
        }
      });

      const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
        CHANGE_USER_ROLE,
        {
          variables: {
            userId: userToModify.id,
            orgId: company.orgId,
            role
          }
        }
      );
      expect(data.changeUserRole.email).toEqual(userToModify.email);
      expect(data.changeUserRole.role).toEqual(role);
      const companyAssociations = await prisma.user
        .findUniqueOrThrow({ where: { id: userToModify.id } })
        .companyAssociations();
      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);
      expect(companyAssociations[0]).toMatchObject(
        getDefaultNotifications(companyAssociations[0].role)
      );
    }
  );

  test("admin can change an invited user's role", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    // Call the mutation to send an invitation
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const invitedUserEmail = "newuser@example.test";

    const userAccoutHash = await hash(
      new Date().valueOf().toString() + Math.random().toString(),
      10
    );

    const invitedUser = await prisma.userAccountHash.create({
      data: {
        hash: userAccoutHash,
        email: invitedUserEmail,
        role: "MEMBER",
        companySiret: company.siret!
      }
    });
    const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
      CHANGE_USER_ROLE,
      {
        variables: {
          userId: invitedUser!.id,
          orgId: company.orgId,
          role: "ADMIN"
        }
      }
    );
    expect(data.changeUserRole.email).toEqual(invitedUser.email);
    expect(data.changeUserRole.role).toEqual("ADMIN");
    const userHash = await prisma.userAccountHash.findMany({
      where: { email: invitedUserEmail }
    });
    expect(userHash).toHaveLength(1);
    expect(userHash[0].role).toEqual("ADMIN");
  });

  test("TD admin user can change a company user's role", async () => {
    const { user: userToModify, company } = await userWithCompanyFactory(
      "MEMBER"
    );
    const tdAdminUser = await userFactory({
      isAdmin: true
    });
    const { mutate } = makeClient({ ...tdAdminUser, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "changeUserRole">>(
      CHANGE_USER_ROLE,
      {
        variables: {
          userId: userToModify.id,
          orgId: company.siret,
          role: "ADMIN"
        }
      }
    );
    expect(data.changeUserRole.email).toEqual(userToModify.email);
    expect(data.changeUserRole.role).toEqual("ADMIN");
    const companyAssociations = await prisma.user
      .findUniqueOrThrow({ where: { id: userToModify.id } })
      .companyAssociations();
    expect(companyAssociations).toHaveLength(1);
    expect(companyAssociations[0].role).toEqual("ADMIN");
  });

  test("user who isn't an admin of a company can't change a company user's role", async () => {
    const { user: userToModify, company } = await userWithCompanyFactory(
      "MEMBER"
    );
    const notAdminUser = await userFactory({
      isAdmin: false
    });
    const { mutate } = makeClient({ ...notAdminUser, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "changeUserRole">>(
      CHANGE_USER_ROLE,
      {
        variables: {
          userId: userToModify.id,
          orgId: company.orgId,
          role: "ADMIN"
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: NotCompanyAdminErrorMsg(company.orgId),
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  test("user who is only a member of a company can't change a company user's role", async () => {
    const { user: userToModify, company } = await userWithCompanyFactory(
      "MEMBER"
    );
    const notAdminUser = await userFactory({
      isAdmin: false,
      companyAssociations: {
        create: {
          company: { connect: { id: company.id } },
          role: "MEMBER"
        }
      }
    });
    const { mutate } = makeClient({ ...notAdminUser, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "changeUserRole">>(
      CHANGE_USER_ROLE,
      {
        variables: {
          userId: userToModify.id,
          orgId: company.orgId,
          role: "ADMIN"
        }
      }
    );
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
