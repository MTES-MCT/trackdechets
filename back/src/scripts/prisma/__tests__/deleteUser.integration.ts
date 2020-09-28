import { prisma } from "../../../generated/prisma-client";
import {
  userFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory,
  formFactory,
  statusLogFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import deleteUser from "../deleteUser";

describe("deleteUser", () => {
  afterEach(() => resetDatabase());

  it("should delete the user account", async () => {
    const user = await userFactory();

    await deleteUser(user);

    const deletedUser = await prisma.user({ id: user.id });
    expect(deletedUser).toBe(null);
  });

  it("should return an error if user owns forms", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    expect.assertions(1);
    try {
      await deleteUser(user);
    } catch (error) {
      expect(error.message).toBe(
        [
          `Impossible de supprimer cet utilisateur car il est propriétaire de 1 BSDs.`,
          `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise ${company.id}.`
        ].join("\n")
      );
    }
  });

  it("should return an error if user owns status logs", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    await statusLogFactory({
      userId: user.id,
      formId: form.id,
      status: "DRAFT"
    });

    // Change form owner
    const otherUser = await userFactory();
    await prisma.updateForm({
      data: {
        owner: {
          connect: {
            id: otherUser.id
          }
        }
      },
      where: {
        id: form.id
      }
    });

    expect.assertions(1);
    try {
      await deleteUser(user);
    } catch (error) {
      expect(error.message).toBe(
        `Impossible de supprimer cet utilisateur car il est propriétaire de 1 status logs.`
      );
    }
  });

  it("should return an error if user is the only admin of a company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    expect.assertions(1);
    try {
      await deleteUser(user);
    } catch (error) {
      expect(error.message).toBe(
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise ${company.id}.`
      );
    }
  });

  it("should remove user from their companies if there are other admins", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const otherUser = await userFactory();
    await prisma.createCompanyAssociation({
      role: "ADMIN",
      user: {
        connect: {
          id: otherUser.id
        }
      },
      company: {
        connect: {
          id: company.id
        }
      }
    });

    await deleteUser(user);

    const companyAssociations = await prisma.companyAssociations({
      where: {
        user: {
          id: user.id
        }
      }
    });
    expect(companyAssociations.length).toBe(0);
  });

  it("should delete user activation hashes", async () => {
    const user = await userFactory();
    await prisma.createUserActivationHash({
      hash: "123456",
      user: {
        connect: { id: user.id }
      }
    });

    await deleteUser(user);

    const activationHashes = await prisma.userActivationHashes({
      where: { user: { id: user.id } }
    });
    expect(activationHashes.length).toBe(0);
  });

  it("should delete user access tokens", async () => {
    const { user } = await userWithAccessTokenFactory();

    await deleteUser(user);

    const accessTokens = await prisma.accessTokens({
      where: {
        user: {
          id: user.id
        }
      }
    });
    expect(accessTokens.length).toBe(0);
  });

  it("should delete user grants", async () => {
    const user = await userFactory();
    await prisma.createGrant({
      code: "",
      redirectUri: "",
      application: {
        create: {
          name: "",
          clientSecret: ""
        }
      },
      expires: 0,
      user: {
        connect: {
          id: user.id
        }
      }
    });

    await deleteUser(user);

    const grants = await prisma.grants({
      where: {
        user: {
          id: user.id
        }
      }
    });
    expect(grants.length).toBe(0);
  });

  it("should return an error if user is the only admin of an application", async () => {
    const user = await userFactory();
    const application = await prisma.createApplication({
      name: "",
      clientSecret: "",
      admins: {
        connect: [
          {
            id: user.id
          }
        ]
      }
    });

    expect.assertions(1);
    try {
      await deleteUser(user);
    } catch (error) {
      expect(error.message).toBe(
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'application ${application.id}.`
      );
    }
  });

  it("should remove user from their applications if there are other admins", async () => {
    const user = await userFactory();
    const otherUser = await userFactory();
    await prisma.createApplication({
      name: "",
      clientSecret: "",
      admins: {
        connect: [
          {
            id: user.id
          },
          {
            id: otherUser.id
          }
        ]
      }
    });

    await deleteUser(user);

    const applications = await prisma.applications({
      where: {
        admins_some: {
          id: user.id
        }
      }
    });
    expect(applications.length).toBe(0);
  });
});
