import gql from "graphql-tag";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationSubscribeToCompanyNotificationsArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { UserRole } from "@prisma/client";
import { toPrismaNotifications } from "../../../notifications";

export const SUBSCRIBE_TO_COMPANY_NOTIFICATIONS = gql`
  mutation SubscribeToCompanyNotifications(
    $input: SubscribeToCompanyNotificationsInput!
  ) {
    subscribeToCompanyNotifications(input: $input) {
      id
      orgId
      userNotifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
        registryDelegation
      }
    }
  }
`;

const unactiveNotifications = {
  notificationIsActiveBsdaFinalDestinationUpdate: false,
  notificationIsActiveBsdRefusal: false,
  notificationIsActiveMembershipRequest: false,
  notificationIsActiveRevisionRequest: false,
  notificationIsActiveSignatureCodeRenewal: false,
  notificationIsActiveRegistryDelegation: false
};

describe("Mutation { subscribeToCompanyNotifications }", () => {
  test("Users who don't belong to company cannot subscribe to notifications", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "subscribeToCompanyNotifications">,
      MutationSubscribeToCompanyNotificationsArgs
    >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
      variables: {
        input: {
          companyOrgId: company.siret!,
          notifications: { membershipRequest: true }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas membre de l'entreprise portant le siret "${company.siret}".`
      })
    ]);
  });

  test.each([
    "membershipRequest",
    "signatureCodeRenewal",
    "bsdRefusal",
    "bsdaFinalDestinationUpdate",
    "revisionRequest",
    "registryDelegation"
  ])(
    "User with role ADMIN can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(
        UserRole.ADMIN,
        {},
        {},
        unactiveNotifications
      );

      const { mutate } = makeClient(user);

      const newNotifications = { [notification]: true };

      const { data, errors } = await mutate<
        Pick<Mutation, "subscribeToCompanyNotifications">,
        MutationSubscribeToCompanyNotificationsArgs
      >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();

      expect(
        data.subscribeToCompanyNotifications.userNotifications
      ).toMatchObject(newNotifications);

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation).toMatchObject({
        ...unactiveNotifications,
        ...toPrismaNotifications({ [notification]: true })
      });
    }
  );

  test.each([
    "signatureCodeRenewal",
    "bsdRefusal",
    "bsdaFinalDestinationUpdate",
    "revisionRequest"
  ])(
    "User with role MEMBER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(
        UserRole.MEMBER,
        {},
        {},
        unactiveNotifications
      );

      const { mutate } = makeClient(user);

      const newNotifications = { [notification]: true };

      const { data, errors } = await mutate<
        Pick<Mutation, "subscribeToCompanyNotifications">,
        MutationSubscribeToCompanyNotificationsArgs
      >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(
        data.subscribeToCompanyNotifications.userNotifications
      ).toMatchObject(newNotifications);

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation).toMatchObject({
        ...unactiveNotifications,
        ...toPrismaNotifications({ [notification]: true })
      });
    }
  );

  test.each([
    "signatureCodeRenewal",
    "bsdRefusal",
    "bsdaFinalDestinationUpdate",
    "revisionRequest"
  ])(
    "User with role READER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(
        UserRole.READER,
        {},
        {},
        unactiveNotifications
      );

      const { mutate } = makeClient(user);

      const newNotifications = { [notification]: true };

      const { data, errors } = await mutate<
        Pick<Mutation, "subscribeToCompanyNotifications">,
        MutationSubscribeToCompanyNotificationsArgs
      >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(
        data.subscribeToCompanyNotifications.userNotifications
      ).toMatchObject(newNotifications);

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation).toMatchObject({
        ...unactiveNotifications,
        ...toPrismaNotifications({ [notification]: true })
      });
    }
  );

  test.each([
    "signatureCodeRenewal",
    "bsdRefusal",
    "bsdaFinalDestinationUpdate"
  ])(
    "User with role DRIVER can subscribe to notification %p",
    async notification => {
      const { user, company } = await userWithCompanyFactory(
        UserRole.DRIVER,
        {},
        {},
        unactiveNotifications
      );

      const { mutate } = makeClient(user);

      const newNotifications = { [notification]: true };

      const { data, errors } = await mutate<
        Pick<Mutation, "subscribeToCompanyNotifications">,
        MutationSubscribeToCompanyNotificationsArgs
      >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: newNotifications
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(
        data.subscribeToCompanyNotifications.userNotifications
      ).toMatchObject(newNotifications);

      const updatedCompanyAssociation =
        await prisma.companyAssociation.findFirstOrThrow({
          where: { companyId: company.id, userId: user.id }
        });

      expect(updatedCompanyAssociation).toMatchObject({
        ...unactiveNotifications,
        ...toPrismaNotifications({ [notification]: true })
      });
    }
  );

  test.each([UserRole.MEMBER, UserRole.DRIVER, UserRole.READER])(
    "users with role %p should not be able to subscribe to MEMBERSHIP_REQUEST notifications",
    async role => {
      const { user, company } = await userWithCompanyFactory(
        role,
        {},
        {},
        unactiveNotifications
      );

      const { mutate } = makeClient(user);

      const { errors } = await mutate<
        Pick<Mutation, "subscribeToCompanyNotifications">,
        MutationSubscribeToCompanyNotificationsArgs
      >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
        variables: {
          input: {
            companyOrgId: company.orgId,
            notifications: { membershipRequest: true }
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
    const { user, company } = await userWithCompanyFactory(
      UserRole.DRIVER,
      {},
      {},
      unactiveNotifications
    );

    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "subscribeToCompanyNotifications">,
      MutationSubscribeToCompanyNotificationsArgs
    >(SUBSCRIBE_TO_COMPANY_NOTIFICATIONS, {
      variables: {
        input: {
          companyOrgId: company.orgId,
          notifications: { revisionRequest: true }
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
