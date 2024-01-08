import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { companyFactory } from "../../../__tests__/factories";
import decodeAmpersandsInCompanyNames from "../decodeAmpersandsInCompanyNames";

describe("decodeAmpersandsInCompanyNames", () => {
  afterAll(resetDatabase);

  it("should decode ampersands", async () => {
    const company1 = await companyFactory({
      name: "TRANSPORTS MARCEL &amp; FILS"
    });
    const company2 = await companyFactory({ name: "TRAITEUER SAS" });
    await decodeAmpersandsInCompanyNames();
    const updatedCompany1 = await prisma.company.findUniqueOrThrow({
      where: { id: company1.id }
    });
    const updatedCompany2 = await prisma.company.findUniqueOrThrow({
      where: { id: company2.id }
    });
    expect(updatedCompany1.name).toEqual("TRANSPORTS MARCEL & FILS");
    expect(updatedCompany2.name).toEqual(company2.name);
  });
});
