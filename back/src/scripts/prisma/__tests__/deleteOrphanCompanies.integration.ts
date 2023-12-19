import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import {
  userFactory,
  companyFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import deleteOrphanCompanies from "../deleteOrphanCompanies";

describe("deleteOrphanCompanies", () => {
  afterAll(resetDatabase);

  it("should delete companies with no company associations", async () => {
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const user = await userFactory();
    const { company: company3, user: user3 } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: company4 } = await userWithCompanyFactory("ADMIN");
    const membershiprequest1 = await prisma.membershipRequest.create({
      data: { companyId: company1.id, userId: user.id }
    });
    const membershiprequest3 = await prisma.membershipRequest.create({
      data: { companyId: company3.id, userId: user3.id }
    });
    await deleteOrphanCompanies();
    expect(
      await prisma.company.findUnique({
        where: { id: company1.id }
      })
    ).toBeNull();
    expect(
      await prisma.company.findUnique({
        where: { id: company2.id }
      })
    ).toBeNull();
    expect(
      await prisma.company.findUnique({
        where: { id: company3.id }
      })
    ).not.toBeNull();
    expect(
      await prisma.company.findUnique({
        where: { id: company4.id }
      })
    ).not.toBeNull();
    expect(
      await prisma.membershipRequest.findUnique({
        where: { id: membershiprequest1.id }
      })
    ).toBeNull();
    expect(
      await prisma.membershipRequest.findUnique({
        where: { id: membershiprequest3.id }
      })
    ).not.toBeNull();
    expect(
      await prisma.user.findUnique({
        where: { id: user.id }
      })
    ).not.toBeNull();
  }, 30000);
});
