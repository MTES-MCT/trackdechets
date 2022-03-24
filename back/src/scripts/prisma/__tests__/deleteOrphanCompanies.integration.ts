import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import deleteOrphanCompanies from "../deleteOrphanCompanies";

describe("deleteOrphanCompanies", () => {
  afterAll(resetDatabase);

  it("should delete companies with no company associations", async () => {
    const company1 = await companyFactory();
    const company2 = await companyFactory();
    const { company: company3 } = await userWithCompanyFactory("ADMIN");
    const { company: company4 } = await userWithCompanyFactory("ADMIN");
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
  });
});
