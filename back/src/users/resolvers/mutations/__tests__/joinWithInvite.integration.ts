import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { companyFactory } from "../../../../__tests__/factories";
import { getUserCompanies } from "../../../database";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { UserRole } from "@td/prisma";
import { getDefaultNotifications } from "../../../notifications";
import { addDays } from "date-fns";

const JOIN_WITH_INVITE = `
  mutation JoinWithInvite($inviteHash: String!, $name: String!, $password: String!){
    joinWithInvite(inviteHash: $inviteHash, name: $name, password: $password){
      email
    }
  }
`;

describe("joinWithInvite mutation", () => {
  it("should not allow name with less than 2 letters", async () => {
    const company = await companyFactory();
    const invitee = "shortname@td.io";
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash-shortname",
        expiresAt: addDays(new Date(), 7)
      }
    });
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "A",
        password: "P4a$$woRd_1234"
      }
    });
    expect(errors).not.toBeUndefined();
    expect(errors?.[0].message).toBe(
      "Le nom doit contenir au moins 2 lettres."
    );
  });

  it("should not allow name with only special characters", async () => {
    const company = await companyFactory();
    const invitee = "specialchars@td.io";
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash-specialchars",
        expiresAt: addDays(new Date(), 7)
      }
    });
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: ".-",
        password: "P4a$$woRd_1234"
      }
    });
    expect(errors).not.toBeUndefined();
    expect(errors?.[0].message).toBe(
      "Le nom doit contenir au moins 2 lettres."
    );
  });
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
        password: "P4a$$woRd_1234"
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should raise exception if invitation is expired", async () => {
    const company = await companyFactory();
    const invitee = "expired.invite@td.io";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "expired-hash",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    });
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "P4a$$woRd_1234"
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
  });

  it("should raise exception if invitation was already accepted", async () => {
    // Given
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash",
        acceptedAt: addDays(new Date(), -1)
      }
    });

    // When
    const { errors } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "P4a$$woRd_1234"
      }
    });

    // Then
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Cette invitation n'existe pas");
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
          hash: "hash",
          expiresAt: addDays(new Date(), 7)
        }
      });

      const { data } = await mutate<Pick<Mutation, "joinWithInvite">>(
        JOIN_WITH_INVITE,
        {
          variables: {
            inviteHash: invitation.hash,
            name: "John Snow",
            password: "P4a$$woRd_1234"
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

  it("should throw if name is only spaces", async () => {
    // Given
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: UserRole.MEMBER,
        hash: "hash",
        expiresAt: addDays(new Date(), 7)
      }
    });

    // When
    const { errors } = await mutate<Pick<Mutation, "joinWithInvite">>(
      JOIN_WITH_INVITE,
      {
        variables: {
          inviteHash: invitation.hash,
          name: "  ",
          password: "P4a$$woRd_1234"
        }
      }
    );

    // Then
    expect(errors).toBeDefined();
    expect(errors[0].message).toContain(
      "Le nom doit contenir au moins 2 lettres."
    );
  });

  it("should accept other pending invitations", async () => {
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation1 = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company1.siret!,
        role: "MEMBER",
        hash: "hash1",
        expiresAt: addDays(new Date(), 7)
      }
    });

    const invitation2 = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company2.siret!,
        role: "MEMBER",
        hash: "hash2",
        expiresAt: addDays(new Date(), 7)
      }
    });

    await mutate(JOIN_WITH_INVITE, {
      variables: {
        name: "John Snow",
        inviteHash: invitation1.hash,
        password: "P4a$$woRd_1234"
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

  it("should return an error if name is empty or password less than 12 characters", async () => {
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash",
        expiresAt: addDays(new Date(), 7)
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
      "Le mot de passe est trop court (Il fait 4 caractères, le minimum est de 12 caractères)"
    );
    const { errors: errs2 } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "",
        password: "P4a$$woRd_1234"
      }
    });
    expect(errs2).toHaveLength(1);
    expect(errs2[0].message).toEqual("Le nom est un champ requis");
  });

  it("should return an error if password is too long", async () => {
    // Given
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash",
        expiresAt: addDays(new Date(), 7)
      }
    });

    // When
    const { errors: errs1 } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "T00LOnG_PA55W0RD_12345678901234567890".repeat(3)
      }
    });

    // Then
    expect(errs1).toHaveLength(1);
    expect(errs1[0].message).toEqual(
      "Le mot de passe est trop long.(Il fait 111 caractères, le maximum est de 64 caractères)"
    );
  });

  it("should return an error if password is not complex enough", async () => {
    // Given
    const company = await companyFactory();
    const invitee = "john.snow@trackdechets.fr";

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: invitee,
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash",
        expiresAt: addDays(new Date(), 7)
      }
    });

    // When
    const { errors: errs1 } = await mutate(JOIN_WITH_INVITE, {
      variables: {
        inviteHash: invitation.hash,
        name: "John Snow",
        password: "password1234"
      }
    });

    // Then
    expect(errs1).toHaveLength(1);
    expect(errs1[0].message).toEqual(
      "Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial."
    );
  });
});
