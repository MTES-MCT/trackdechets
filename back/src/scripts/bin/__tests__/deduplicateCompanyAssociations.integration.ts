import { resetDatabase } from "../../../../integration-tests/helper";

import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import deduplicateCompanyAssociations from "../deduplicateCompanyAssociations.helpers";
describe("deduplicateCompanyAssociations script", () => {
  afterEach(resetDatabase);

  it("should remove duplicate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: company.id } },
        user: { connect: { id: user.id } },
        role: "ADMIN"
      }
    });
    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: company.id } },
        user: { connect: { id: user.id } },
        role: "ADMIN"
      }
    });
    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: company.id } },
        user: { connect: { id: user.id } },
        role: "MEMBER"
      }
    });

    await deduplicateCompanyAssociations();

    const remaining = await prisma.companyAssociation.findMany({
      where: { userId: user.id, companyId: company.id }
    });
    expect(remaining.length).toEqual(1);
    expect(remaining[0].role).toEqual("ADMIN");
  });

  it("should leave single associations unaffected", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await deduplicateCompanyAssociations();

    const remaining = await prisma.companyAssociation.findMany({
      where: { userId: user.id, companyId: company.id }
    });
    expect(remaining.length).toEqual(1);
    expect(remaining[0].role).toEqual("MEMBER");
  });
});
