import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  formFactory,
  statusLogFactory,
  userFactory,
  userWithAccessTokenFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
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

    const updatedForm = await prisma.form.findUnique({
      where: { id: form.id },
      include: { owner: { select: { id: true } } }
    });
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

    const updatedStatusLog = await prisma.statusLog.findUnique({
      where: { id: statusLog.id },
      include: { user: { select: { id: true } } }
    });
    expect(updatedStatusLog.user.id).toBe(heir.id);
  });

  it("should add heir to company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const heir = await userFactory();

    await mergeUsers(user, heir);

    const [heirCompanyAssociation] = await prisma.companyAssociation.findMany({
      where: { user: { id: heir.id }, company: { id: company.id } }
    });
    expect(heirCompanyAssociation).not.toBe(null);
  });

  it("should upgrade heir role in company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const heir = await userFactory();
    await prisma.companyAssociation.create({
      data: {
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
      }
    });

    await mergeUsers(user, heir);

    const [heirCompanyAssociation] = await prisma.companyAssociation.findMany({
      where: { user: { id: heir.id }, company: { id: company.id } }
    });
    expect(heirCompanyAssociation.role).toBe("ADMIN");
  });

  it("should transfer access tokens to heir", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();
    const heir = await userFactory();

    await mergeUsers(user, heir);

    const updatedAccessToken = await prisma.accessToken.findUnique({
      where: { id: accessToken.id },
      include: { user: { select: { id: true } } }
    });
    expect(updatedAccessToken.user.id).toBe(heir.id);
  });

  it("should transfer applications to heir", async () => {
    const user = await userFactory();
    const heir = await userFactory();
    const application = await prisma.application.create({
      data: {
        name: "",
        clientSecret: "",
        admins: {
          connect: [
            {
              id: user.id
            }
          ]
        }
      }
    });

    await mergeUsers(user, heir);

    const updatedApplication = await prisma.application.findUnique({
      where: {
        id: application.id
      },
      include: { admins: { select: { id: true } } }
    });
    expect(
      updatedApplication.admins.find(admin => admin.id === heir.id)
    ).not.toBe(null);
  });
});
