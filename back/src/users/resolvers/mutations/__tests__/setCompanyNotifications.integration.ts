import gql from "graphql-tag";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationSetCompanyNotificationsArgs
} from "../../../../generated/graphql/types";
import { ALL_NOTIFICATIONS } from "@td/constants";
import { prisma } from "@td/prisma";
import { UserNotification, UserRole } from "@prisma/client";

export const SET_COMPANY_NOTIFICATIONS = gql`
  mutation SetCompanyNotifications($input: SetCompanyNotificationsInput!) {
    setCompanyNotifications(input: $input) {
      id
      orgId
      userNotifications
    }
  }
`;

describe("Mutation { setCompanyNotifications }", () => {
  test("Users who don't belong to company cannot subscribe to notifications", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    const { mutate } = makeClient(user);

    const newNotifications = [UserNotification.MEMBERSHIP_REQUEST];

    const { errors } = await mutate<
      Pick<Mutation, "setCompanyNotifications">,
      MutationSetCompanyNotificationsArgs
    >(SET_COMPANY_NOTIFICATIONS, {
      variables: {
        input: {
          companyOrgId: company.siret!,
          notifications: newNotifications
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas membre de l'entreprise portant le siret "${company.siret}".`
      })
    ]);
  });

  test.each(ALL_NOTIFICATIONS)(
    "User with role ADMIN can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(companyAssociation.notifications).toEqual(ALL_NOTIFICATIONS);

      const { mutate } = makeClient(user);

      const newNotifications = [notification];

      const { data, errors } = await mutate<
        Pick<Mutation, "setCompanyNotifications">,
        MutationSetCompanyNotificationsArgs
      >(SET_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();

      expect(data.setCompanyNotifications.userNotifications).toEqual(
        newNotifications
      );

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation.notifications).toEqual(newNotifications);
    }
  );

  test.each([
    UserNotification.REVISION_REQUEST,
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ])(
    "User with role MEMBER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);

      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(companyAssociation.notifications).toEqual([]);

      const { mutate } = makeClient(user);

      const newNotifications = [notification];

      const { data, errors } = await mutate<
        Pick<Mutation, "setCompanyNotifications">,
        MutationSetCompanyNotificationsArgs
      >(SET_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.setCompanyNotifications.userNotifications).toEqual(
        newNotifications
      );

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation.notifications).toEqual(newNotifications);
    }
  );

  test.each([
    UserNotification.REVISION_REQUEST,
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ])(
    "User with role READER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(UserRole.READER);

      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(companyAssociation.notifications).toEqual([]);

      const { mutate } = makeClient(user);

      const newNotifications = [notification];

      const { data, errors } = await mutate<
        Pick<Mutation, "setCompanyNotifications">,
        MutationSetCompanyNotificationsArgs
      >(SET_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.setCompanyNotifications.userNotifications).toEqual(
        newNotifications
      );

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation.notifications).toEqual(newNotifications);
    }
  );

  test.each([
    UserNotification.BSD_REFUSAL,
    UserNotification.SIGNATURE_CODE_RENEWAL,
    UserNotification.BSDA_FINAL_DESTINATION_UPDATE
  ])(
    "User with role DRIVER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(UserRole.DRIVER);

      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(companyAssociation.notifications).toEqual([]);

      const { mutate } = makeClient(user);

      const newNotifications = [notification];

      const { data, errors } = await mutate<
        Pick<Mutation, "setCompanyNotifications">,
        MutationSetCompanyNotificationsArgs
      >(SET_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.setCompanyNotifications.userNotifications).toEqual(
        newNotifications
      );

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation.notifications).toEqual(newNotifications);
    }
  );

  test.each([UserRole.MEMBER, UserRole.DRIVER, UserRole.READER])(
    "users with role %p should not be able to subscribe to MEMBERSHIP_REQUEST notifications",
    async role => {
      const { user, company } = await userWithCompanyFactory(role);

      const companyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(companyAssociation.notifications).toEqual([]);

      const { mutate } = makeClient(user);

      const newNotifications = [UserNotification.MEMBERSHIP_REQUEST];

      const { errors } = await mutate<
        Pick<Mutation, "setCompanyNotifications">,
        MutationSetCompanyNotificationsArgs
      >(SET_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Votre rôle au sein de l'établissement ne vous permet pas de recevoir les notifications de type MEMBERSHIP_REQUEST"
        })
      ]);
    }
  );

  test("Users with role DRIVER should not be able to susbcribe to REVISION_REQUEST notifications", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.DRIVER);

    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      {
        where: { companyId: company.id, userId: user.id }
      }
    );

    expect(companyAssociation.notifications).toEqual([]);

    const { mutate } = makeClient(user);

    const newNotifications = [UserNotification.REVISION_REQUEST];

    const { errors } = await mutate<
      Pick<Mutation, "setCompanyNotifications">,
      MutationSetCompanyNotificationsArgs
    >(SET_COMPANY_NOTIFICATIONS, {
      variables: {
        input: {
          companyOrgId: company.orgId,
          notifications: newNotifications
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Votre rôle au sein de l'établissement ne vous permet pas de recevoir les notifications de type REVISION_REQUEST"
      })
    ]);
  });
});
