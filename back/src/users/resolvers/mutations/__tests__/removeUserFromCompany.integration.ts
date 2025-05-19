import {
  userWithCompanyFactory,
  userFactory,
  adminFactory
} from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth/auth";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { getUserRoles } from "../../../../permissions";
import { ErrorCode, NotCompanyAdminErrorMsg } from "../../../../common/errors";

const REMOVE_USER_FROM_COMPANY = `mutation RemoveUserFromCompany($userId: ID!, $siret: String!){
  removeUserFromCompany(userId: $userId, siret: $siret){
    siret
  }
}`;

describe("mutation removeUserFromCompany", () => {
  afterEach(resetDatabase);

  async function isMemberFn(userId: string, siret: string) {
    const elem = await prisma.companyAssociation.findFirst({
      where: {
        user: { id: userId },
        company: { siret }
      }
    });

    return elem != null;
  }

  it("should remove a user from a company", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        role: "MEMBER"
      }
    });
    let isMember = await isMemberFn(user.id, company.siret!);
    expect(isMember).toEqual(true);
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    await mutate(REMOVE_USER_FROM_COMPANY, {
      variables: { userId: user.id, siret: company.siret }
    });
    isMember = await isMemberFn(user.id, company.siret!);
    expect(isMember).toEqual(false);
  });

  it("should reset cache", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        role: "MEMBER"
      }
    });

    expect(Object.keys(await getUserRoles(user.id))).toEqual([company.siret]);

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    await mutate(REMOVE_USER_FROM_COMPANY, {
      variables: { userId: user.id, siret: company.siret }
    });
    expect(Object.keys(await getUserRoles(user.id))).toEqual([]);
  });

  it("TD admin user can remove a user from a company", async () => {
    const { user: userToRemove, company } = await userWithCompanyFactory(
      "ADMIN"
    );
    const tdAdminUser = await adminFactory();
    let isMember = await isMemberFn(userToRemove.id, company.siret!);
    expect(isMember).toEqual(true);
    const { mutate } = makeClient({ ...tdAdminUser, auth: AuthType.Session });
    await mutate(REMOVE_USER_FROM_COMPANY, {
      variables: { userId: userToRemove.id, siret: company.siret }
    });
    isMember = await isMemberFn(userToRemove.id, company.siret!);
    expect(isMember).toEqual(false);
  });

  test("user who isn't an admin of a company can't remove a user from a company", async () => {
    const { user: userToRemove, company } = await userWithCompanyFactory(
      "ADMIN"
    );
    const notAdminUser = await userFactory({
      isAdmin: false
    });
    const { mutate } = makeClient({ ...notAdminUser, auth: AuthType.Session });

    const { errors } = await mutate(REMOVE_USER_FROM_COMPANY, {
      variables: { userId: userToRemove.id, siret: company.siret }
    });
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
