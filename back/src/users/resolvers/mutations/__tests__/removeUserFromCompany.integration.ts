import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import { prisma } from "../../../../generated/prisma-client";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";

const REMOVE_USER_FROM_COMPANY = `mutation RemoveUserFromCompany($userId: ID!, $siret: String!){
  removeUserFromCompany(userId: $userId, siret: $siret){
    siret
  }
}`;

describe("mutation removeUserFromCompany", () => {
  afterEach(resetDatabase);

  function isMemberFn(userId: string, siret: string) {
    return prisma.$exists.companyAssociation({
      user: { id: userId },
      company: { siret }
    });
  }

  it("should remove a user from a company", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    await prisma.createCompanyAssociation({
      user: { connect: { id: user.id } },
      company: { connect: { id: company.id } },
      role: "MEMBER"
    });
    let isMember = await isMemberFn(user.id, company.siret);
    expect(isMember).toEqual(true);
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    await mutate(REMOVE_USER_FROM_COMPANY, {
      variables: { userId: user.id, siret: company.siret }
    });
    isMember = await isMemberFn(user.id, company.siret);
    expect(isMember).toEqual(false);
  });
});
