import { Rule, RuleAnd } from "graphql-shield/dist/rules";

import { isCompanyAdmin, isCompanyMember, isCompaniesUser } from "../rules";
import { GraphQLResolveInfo } from "graphql";

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

    expect(result).toBeInstanceOf(Error);
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
    expect(result).toBeInstanceOf(Error);
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
    expect(result).toBeInstanceOf(Error);
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
    expect(result).toBeInstanceOf(Error);
  });
});

describe("isCompaniesUser", () => {
  it("should return true if the user is user of the companies", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValueOnce([{ role: "ADMIN" }]);
    prisma.companyAssociations.mockResolvedValueOnce([{ role: "MEMBER" }]);
    const result = await testRule(isCompaniesUser)(
      null,
      { sirets: ["85001946400013", "85001946400014"] },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(true);
  });

  it("should return false if the user does not belong to one of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValueOnce([{ role: "ADMIN" }]);
    prisma.companyAssociations.mockResolvedValueOnce([]);
    const result = await testRule(isCompaniesUser)(
      null,
      { sirets: ["85001946400013", "85001946400014"] },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBeInstanceOf(Error);
  });
});

export function testRule(rule: Rule | RuleAnd) {
  return (parent, args, ctx) =>
    rule.resolve(
      parent,
      args,
      { _shield: { cache: {} }, ...ctx },
      {} as GraphQLResolveInfo,
      {} as any
    );
}
