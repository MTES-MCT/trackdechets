import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { companyFactory } from "../../../../__tests__/factories";
import { getUserCompanies } from "../../../database";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { UserRole } from "@prisma/client";
import { getDefaultNotifications } from "../../../notifications";

const JOIN_WITH_INVITE = `
  mutation JoinWithInvite($inviteHash: String!, $name: String!, $password: String!){
    joinWithInvite(inviteHash: $inviteHash, name: $name, password: $password){
      email
    }
  }
`;

describe("joinWithInvite mutation", () => {
  let mutate: ReturnType<typeof makeClient>["mutate"];
  beforeAll(() => {
    const testClient = makeClient();
    mutate = testClient.mutate;
  });
  afterEach(resetDatabase);

  it("should raise exception if invitation does not exist", async () => {
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: "invalid",
        name: "John Snow",
        password: "password"
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should raise exception if invitation was already accepted", async () => {
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash",
        acceptedAt: new Date()
      }
    });
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "password"
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation a déjà été acceptée");
  });

  it.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.READER, UserRole.DRIVER])(
    "should create user, associate it to company with role %p and mark invitation as joined",
    async role => {
      const company = await companyFactory();
      const invitee = "john.snow@trackdechets.fr";

      const invitation = await prisma.userAccountHash.create({
        data: {
          email: invitee,
          companySiret: company.siret!,
          role,
          hash: "hash"
        }
      });

      const { data } = await mutate<Pick<Mutation, "joinWithInvite">>(
        JOIN_WITH_INVITE,
        {
          variables: {
            inviteHash: invitation.hash,
            name: "John Snow",
            password: "password"
          }
        }
      );

      expect(data.joinWithInvite.email).toEqual(invitee);

      // should mark invitation as joined
      const updatedInvitation = await prisma.userAccountHash.findUniqueOrThrow({
        where: {
          id: invitation.id
        }
      });
      expect(updatedInvitation.acceptedAt).not.toBeNull();

      const companyAssociation = await prisma.companyAssociation.findFirst({
        where: {
          user: { email: invitee },
          company: { siret: company.siret }
        }
      });

      // check invitee is company member
      expect(companyAssociation).not.toBeNull();
      expect(companyAssociation?.role).toEqual(role);

      const expectedNotifications = getDefaultNotifications(role);

      expect(companyAssociation).toMatchObject(expectedNotifications);

      const createdUser = await prisma.user.findUniqueOrThrow({
        where: { email: invitee }
      });
      expect(createdUser.activatedAt).toBeTruthy();
      expect(createdUser.firstAssociationDate).toBeTruthy();
    }
  );

  it("should accept other pending invitations", async () => {
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation1 = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company1.siret!,
        role: "MEMBER",
        hash: "hash1"
      }
    });

    const invitation2 = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company2.siret!,
        role: "MEMBER",
        hash: "hash2"
      }
    });

    await mutate(JOIN_WITH_INVITE, {
      variables: {
        name: "John Snow",
        inviteHash: invitation1.hash,
        password: "password"
      }
    });

    const updatedInvitation2 = await prisma.userAccountHash.findUniqueOrThrow({
      where: {
        id: invitation2.id
      }
    });
    expect(updatedInvitation2.acceptedAt).not.toBeNull();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: invitee }
    });
    const companies = await getUserCompanies(user.id);

    expect(companies.length).toEqual(2);
    expect(companies.map(c => c.siret).sort()).toEqual(
      [company1.siret, company2.siret].sort()
    );
  });

  it("should return an error if name is empty or password less than 8 characters", async () => {
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash"
      }
    });
    const { errors: errs1 } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "pass"
      }
    });
    expect(errs1).toHaveLength(1);
    expect(errs1[0].message).toEqual(
      "Le mot de passe doit faire au moins 8 caractères"
    );
    const { errors: errs2 } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "",
        password: "password"
      }
    });
    expect(errs2).toHaveLength(1);
    expect(errs2[0].message).toEqual("Le nom est un champ requis");
  });
});
