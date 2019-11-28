import { Rule } from "graphql-shield/dist/rules";

import { isCompanyAdmin, isCompanyMember } from "../rules";

describe("isCompanyAdmin", () => {
  it("should return true if the user is admin of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "ADMIN" }]);
    const result = await testRule(isCompanyAdmin)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(true);
  });

  it("should return false if the user is member of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "MEMBER" }]);
    const result = await testRule(isCompanyAdmin)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );

    expect(result).toBe(false);
  });

  it("should return false if the user does not belong to the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([]);
    const result = await testRule(isCompanyAdmin)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(false);
  });
});

describe("isCompanyMember", () => {
  it("should return false if the user is admin of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "ADMIN" }]);
    const result = await testRule(isCompanyMember)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(false);
  });

  it("should return true if the user is member of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "MEMBER" }]);
    const result = await testRule(isCompanyMember)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );

    expect(result).toBe(true);
  });

  it("should return false if the user does not belong to the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([]);
    const result = await testRule(isCompanyMember)(
      null,
      { siret: "85001946400013" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(false);
  });
});

export function testRule(rule: Rule) {
  return (parent, args, ctx) =>
    rule.resolve(parent, args, ctx as any, null, {} as any);
}
