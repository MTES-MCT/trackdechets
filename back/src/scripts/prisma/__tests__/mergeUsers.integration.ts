import { prisma } from "../../../generated/prisma-client";
import {
  userFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory,
  formFactory,
  statusLogFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import mergeUsers from "../mergeUsers";

describe("mergeUsers", () => {
  afterEach(() => resetDatabase());

  it("should transfer forms to heir", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const heir = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    await mergeUsers(user, heir);

    const updatedForm = await prisma
      .form({ id: form.id })
      .$fragment<{ id: string; owner: { id: string } }>(
        `fragment UpdatedForm on Form {
          id
          owner {
            id
          }
        }`
      );
    expect(updatedForm.owner.id).toBe(heir.id);
  });

  it("should transfer status logs to heir", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const statusLog = await statusLogFactory({
      userId: user.id,
      formId: form.id,
      status: "DRAFT"
    });
    const heir = await userFactory();

    await mergeUsers(user, heir);

    const updatedStatusLog = await prisma
      .statusLog({ id: statusLog.id })
      .$fragment<{ id: string; user: { id: string } }>(
        `fragment UpdatedStatusLog on StatusLog {
          id
          user {
            id
          }
        }`
      );
    expect(updatedStatusLog.user.id).toBe(heir.id);
  });

  it("should add heir to company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const heir = await userFactory();

    await mergeUsers(user, heir);

    const [heirCompanyAssociation] = await prisma.companyAssociations({
      where: { user: { id: heir.id }, company: { id: company.id } }
    });
    expect(heirCompanyAssociation).not.toBe(null);
  });

  it("should upgrade heir role in company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const heir = await userFactory();
    await prisma.createCompanyAssociation({
      role: "MEMBER",
      user: {
        connect: {
          id: heir.id
        }
      },
      company: {
        connect: {
          id: company.id
        }
      }
    });

    await mergeUsers(user, heir);

    const [heirCompanyAssociation] = await prisma.companyAssociations({
      where: { user: { id: heir.id }, company: { id: company.id } }
    });
    expect(heirCompanyAssociation.role).toBe("ADMIN");
  });

  it("should transfer access tokens to heir", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();
    const heir = await userFactory();

    await mergeUsers(user, heir);

    const updatedAccessToken = await prisma
      .accessToken({
        id: accessToken.id
      })
      .$fragment<{ id: string; user: { id: string } }>(
        `fragment UpdatedAccessToken on AccessToken {
          id
          user {
            id
          }
        }`
      );
    expect(updatedAccessToken.user.id).toBe(heir.id);
  });

  it("should transfer applications to heir", async () => {
    const user = await userFactory();
    const heir = await userFactory();
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

    await mergeUsers(user, heir);

    const updatedApplication = await prisma
      .application({
        id: application.id
      })
      .$fragment<{ id: string; admins: Array<{ id: string }> }>(
        `fragment UpdatedApplication on Application {
          id
          admins {
            id
          }
        }`
      );
    expect(
      updatedApplication.admins.find(admin => admin.id === heir.id)
    ).not.toBe(null);
  });
});
