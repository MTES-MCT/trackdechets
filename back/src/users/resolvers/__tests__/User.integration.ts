import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userFactory,
  userInCompany,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import userResolvers from "../User";

describe("User.companies", () => {
  afterEach(resetDatabase);

  it("does not expose companies of another user when authenticated user is not a member", async () => {
    // Alice belongs to company A
    const { user: alice } = await userWithCompanyFactory("ADMIN");

    // Bob does not belong to company A
    const bob = await userFactory();

    const companies = await userResolvers.companies!(
      alice,
      {},
      { user: bob } as any,
      {} as any
    );

    await expect(Promise.all(companies)).resolves.toEqual([]);
  });

  it("returns companies of the authenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const companies = await userResolvers.companies!(
      user,
      {},
      { user } as any,
      {} as any
    );

    const result = await Promise.all(companies);

    expect(result).toHaveLength(1);
    expect(result[0].orgId).toEqual(company.orgId);
    expect(result[0].securityCode).toEqual(company.securityCode);
  });

  it("returns a company of another user when authenticated user is also a member", async () => {
    // Alice belongs to company A
    const { user: alice, company } = await userWithCompanyFactory("ADMIN");

    // Bob also belongs to company A
    const bob = await userInCompany("MEMBER", company.id);

    const companies = await userResolvers.companies!(
      alice,
      {},
      { user: bob } as any,
      {} as any
    );

    const result = await Promise.all(companies);

    expect(result).toHaveLength(1);
    expect(result[0].orgId).toEqual(company.orgId);
    expect(result[0].securityCode).toEqual(company.securityCode);
  });
});
