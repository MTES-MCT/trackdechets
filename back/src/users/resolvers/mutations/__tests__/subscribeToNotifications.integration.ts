import {
  Mutation,
  MutationSubscribeToNotificationsArgs,
  UserNotifications
} from "@td/codegen-ui";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { associateUserToCompany } from "../../../database";
import { Prisma } from "@prisma/client";
import gql from "graphql-tag";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { toPrismaNotifications } from "../../../notifications";

export const SUBSCRIBE_TO_NOTIFICATIONS = gql`
  mutation SubscribeToNotifications($input: SubscribeToNotificationsInput!) {
    subscribeToNotifications(input: $input) {
      id
      orgId
      userNotifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
      }
    }
  }
`;

const allUnsubscribedPrisma: Partial<Prisma.CompanyAssociationCreateInput> = {
  notificationIsActiveBsdaFinalDestinationUpdate: false,
  notificationIsActiveBsdRefusal: false,
  notificationIsActiveMembershipRequest: false,
  notificationIsActiveRevisionRequest: false,
  notificationIsActiveSignatureCodeRenewal: false
};

const allUnsubscribedGql: UserNotifications = {
  membershipRequest: false,
  signatureCodeRenewal: false,
  bsdRefusal: false,
  bsdaFinalDestinationUpdate: false,
  revisionRequest: false
};

const allNotifications = Object.keys(allUnsubscribedGql);

describe("mutation { subscribeToNotifications }", () => {
  it.each(allNotifications)(
    "should activate notification %p for all user companies",
    async notification => {
      const user = await userFactory();
      const company1 = await companyFactory();
      const company2 = await companyFactory();

      const companyAssociation1 = await associateUserToCompany(
        user.id,
        company1.orgId,
        "ADMIN",
        allUnsubscribedPrisma
      );

      const companyAssociation2 = await associateUserToCompany(
        user.id,
        company2.orgId,
        "ADMIN",
        allUnsubscribedPrisma
      );

      const { mutate } = makeClient(user);

      const update = { [notification]: true };

      const { errors, data } = await mutate<
        Pick<Mutation, "subscribeToNotifications">,
        MutationSubscribeToNotificationsArgs
      >(SUBSCRIBE_TO_NOTIFICATIONS, {
        variables: { input: { notifications: update } }
      });

      expect(errors).toBeUndefined();

      for (const company of data.subscribeToNotifications) {
        expect(company.userNotifications).toEqual({
          ...allUnsubscribedGql,
          [notification]: true
        });
      }

      const updatedCompanyAssociation1 =
        await prisma.companyAssociation.findUniqueOrThrow({
          where: { id: companyAssociation1.id }
        });

      const updatedCompanyAssociation2 =
        await prisma.companyAssociation.findUniqueOrThrow({
          where: { id: companyAssociation2.id }
        });

      expect(updatedCompanyAssociation1).toMatchObject({
        ...allUnsubscribedPrisma,
        ...toPrismaNotifications(update)
      });

      expect(updatedCompanyAssociation2).toMatchObject({
        ...allUnsubscribedPrisma,
        ...toPrismaNotifications(update)
      });
    }
  );
});
