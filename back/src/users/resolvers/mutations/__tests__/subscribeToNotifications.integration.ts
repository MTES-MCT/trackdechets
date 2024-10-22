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

const allSubscribedPrisma: Partial<Prisma.CompanyAssociationCreateInput> = {
  notificationIsActiveBsdaFinalDestinationUpdate: true,
  notificationIsActiveBsdRefusal: true,
  notificationIsActiveMembershipRequest: true,
  notificationIsActiveRevisionRequest: true,
  notificationIsActiveSignatureCodeRenewal: true
};

const allSubscribedGql: UserNotifications = {
  membershipRequest: true,
  signatureCodeRenewal: true,
  bsdRefusal: true,
  bsdaFinalDestinationUpdate: true,
  revisionRequest: true
};

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

describe("mutation { subscribeToNotifications }", () => {
  it("should activate notification for all user companies if user role authorize it", async () => {
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

    expect(companyAssociation1).toMatchObject(allUnsubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allUnsubscribedPrisma);

    const { mutate } = makeClient(user);

    const { errors, data } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: allSubscribedGql } }
    });

    expect(errors).toBeUndefined();

    for (const company of data.subscribeToNotifications) {
      expect(company.userNotifications).toEqual(allSubscribedGql);
    }

    const updatedCompanyAssociation1 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation1.id }
      });

    const updatedCompanyAssociation2 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation2.id }
      });

    expect(updatedCompanyAssociation1).toMatchObject(allSubscribedPrisma);

    expect(updatedCompanyAssociation2).toMatchObject(allSubscribedPrisma);
  });

  it("should deactivate notifications for all user companies", async () => {
    const user = await userFactory();
    const company1 = await companyFactory();
    const company2 = await companyFactory();

    const companyAssociation1 = await associateUserToCompany(
      user.id,
      company1.orgId,
      "ADMIN",
      allSubscribedPrisma
    );

    const companyAssociation2 = await associateUserToCompany(
      user.id,
      company2.orgId,
      "ADMIN",
      allSubscribedPrisma
    );

    expect(companyAssociation1).toMatchObject(allSubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allSubscribedPrisma);

    const { mutate } = makeClient(user);

    const { errors, data } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: allUnsubscribedGql } }
    });

    expect(errors).toBeUndefined();

    for (const company of data.subscribeToNotifications) {
      expect(company.userNotifications).toEqual(allUnsubscribedGql);
    }

    const updatedCompanyAssociation1 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation1.id }
      });

    const updatedCompanyAssociation2 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation2.id }
      });

    expect(updatedCompanyAssociation1).toMatchObject(allUnsubscribedPrisma);

    expect(updatedCompanyAssociation2).toMatchObject(allUnsubscribedPrisma);
  });

  it("should not update notifications if input is empty", async () => {
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

    expect(companyAssociation1).toMatchObject(allUnsubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allUnsubscribedPrisma);

    const { mutate } = makeClient(user);

    const { errors, data } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: {} } }
    });

    expect(errors).toBeUndefined();

    for (const company of data.subscribeToNotifications) {
      expect(company.userNotifications).toEqual(allUnsubscribedGql);
    }

    const updatedCompanyAssociation1 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation1.id }
      });

    const updatedCompanyAssociation2 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation2.id }
      });

    expect(updatedCompanyAssociation1).toMatchObject(allUnsubscribedPrisma);

    expect(updatedCompanyAssociation2).toMatchObject(allUnsubscribedPrisma);
  });

  it("should not subscribe to notifications for companies where role does not allow it", async () => {
    const user = await userFactory();
    const company1 = await companyFactory();
    const company2 = await companyFactory();

    const companyAssociation1 = await associateUserToCompany(
      user.id,
      company1.orgId,
      "DRIVER",
      allUnsubscribedPrisma
    );

    const companyAssociation2 = await associateUserToCompany(
      user.id,
      company2.orgId,
      "DRIVER",
      allUnsubscribedPrisma
    );

    expect(companyAssociation1).toMatchObject(allUnsubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allUnsubscribedPrisma);

    const { mutate } = makeClient(user);

    const { errors, data } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: allSubscribedGql } }
    });

    expect(errors).toBeUndefined();

    for (const company of data.subscribeToNotifications) {
      expect(company.userNotifications).toEqual({
        ...allSubscribedGql,
        // Les notifications suivantes ne sont pas autorisées pour un rôle Chauffeur
        // Leurs valeurs est donc inchangées
        membershipRequest: false,
        revisionRequest: false
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

    const expected = {
      ...allSubscribedPrisma,
      // Les notifications suivantes ne sont pas autorisées pour un rôle Chauffeur
      // Leurs valeurs est donc inchangées
      notificationIsActiveMembershipRequest: false,
      notificationIsActiveRevisionRequest: false
    };

    expect(updatedCompanyAssociation1).toMatchObject(expected);

    expect(updatedCompanyAssociation2).toMatchObject(expected);
  });

  it("should not subscribe other users", async () => {
    const user1 = await userFactory();
    const user2 = await userFactory();

    const company1 = await companyFactory();
    const company2 = await companyFactory();

    const companyAssociation1 = await associateUserToCompany(
      user1.id,
      company1.orgId,
      "ADMIN",
      allUnsubscribedPrisma
    );

    const companyAssociation2 = await associateUserToCompany(
      user2.id,
      company2.orgId,
      "ADMIN",
      allUnsubscribedPrisma
    );

    expect(companyAssociation1).toMatchObject(allUnsubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allUnsubscribedPrisma);

    const { mutate } = makeClient(user1);

    const { errors } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: allSubscribedGql } }
    });

    expect(errors).toBeUndefined();

    const updatedCompanyAssociation1 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation1.id }
      });

    const updatedCompanyAssociation2 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation2.id }
      });

    expect(updatedCompanyAssociation1).toMatchObject(allSubscribedPrisma);

    // Les notifications de l'utilisateur 2 ne sont pas impactées
    expect(updatedCompanyAssociation2).toMatchObject(allUnsubscribedPrisma);
  });

  it("should not unsubscribe other users", async () => {
    const user1 = await userFactory();
    const user2 = await userFactory();

    const company1 = await companyFactory();
    const company2 = await companyFactory();

    const companyAssociation1 = await associateUserToCompany(
      user1.id,
      company1.orgId,
      "ADMIN",
      allSubscribedPrisma
    );

    const companyAssociation2 = await associateUserToCompany(
      user2.id,
      company2.orgId,
      "ADMIN",
      allSubscribedPrisma
    );

    expect(companyAssociation1).toMatchObject(allSubscribedPrisma);
    expect(companyAssociation2).toMatchObject(allSubscribedPrisma);

    const { mutate } = makeClient(user1);

    const { errors } = await mutate<
      Pick<Mutation, "subscribeToNotifications">,
      MutationSubscribeToNotificationsArgs
    >(SUBSCRIBE_TO_NOTIFICATIONS, {
      variables: { input: { notifications: allUnsubscribedGql } }
    });

    expect(errors).toBeUndefined();

    const updatedCompanyAssociation1 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation1.id }
      });

    const updatedCompanyAssociation2 =
      await prisma.companyAssociation.findUniqueOrThrow({
        where: { id: companyAssociation2.id }
      });

    expect(updatedCompanyAssociation1).toMatchObject(allUnsubscribedPrisma);

    // Les notifications de l'utilisateur 2 ne sont pas impactées
    expect(updatedCompanyAssociation2).toMatchObject(allSubscribedPrisma);
  });
});
