import { Rule, RuleAnd } from "graphql-shield/dist/rules";

import {
  isAuthenticated,
  isCompanyAdmin,
  isCompanyMember,
  isCompaniesUser,
  isAuthenticatedFromUI
} from "../rules";
import { GraphQLResolveInfo } from "graphql";
import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { AuthType } from "../../auth";

describe("isAuthenticated", () => {
  it("should return AuthenticationError if there is no user in context", async () => {
    const context = {};
    const result = await testRule(isAuthenticated)(null, {}, context);
    expect(result).toBeInstanceOf(AuthenticationError);
  });

  it("should return true if there a user in context", async () => {
    const context = { user: { id: "id" } };
    const result = await testRule(isAuthenticated)(null, {}, context);
    expect(result).toEqual(true);
  });
});

describe("isAuthenticatedFromUI", () => {
  it("should return AuthenticationError if there is no user in context", async () => {
    const context = {};
    const result = await testRule(isAuthenticatedFromUI)(null, {}, context);
    expect(result).toBeInstanceOf(AuthenticationError);
  });

  it("should return ForbiddenError if a user is authenticated with Bearer token", async () => {
    const context = { user: { id: "id", auth: AuthType.Bearer } };
    const result = await testRule(isAuthenticatedFromUI)(null, {}, context);
    expect(result).toBeInstanceOf(ForbiddenError);
  });

  it("should return ForbiddenError if a user is authenticated with JWT token", async () => {
    const context = { user: { id: "id", auth: AuthType.JWT } };
    const result = await testRule(isAuthenticatedFromUI)(null, {}, context);
    expect(result).toBeInstanceOf(ForbiddenError);
  });

  it("should return true if a user is authenticated with a session cookie", async () => {
    const context = { user: { id: "id", auth: AuthType.Session } };
    const result = await testRule(isAuthenticatedFromUI)(null, {}, context);
    expect(result).toEqual(true);
  });
});

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
