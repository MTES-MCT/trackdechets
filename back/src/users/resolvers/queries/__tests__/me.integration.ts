import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { Query } from "@td/codegen-back";

const ME = `
  query Me {
    me {
      id
      isAdmin
      companies {
        siret
        userRole
        userPermissions
      }
    }
  }
`;

describe("query me", () => {
  afterAll(resetDatabase);

  it("should return authenticated user", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "me">>(ME);
    expect(data.me.id).toEqual(user.id);
    expect(data.me.isAdmin).toEqual(false);
  });

  it("should return user companies with role and permissions", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "me">>(ME);
    const companies = data.me.companies;
    expect(companies).toHaveLength(1);
    expect(companies[0].siret).toEqual(company.siret);
    expect(companies[0].userRole).toEqual("MEMBER");
    expect(companies[0].userPermissions).toEqual([
      "BSD_CAN_READ",
      "BSD_CAN_LIST",
      "COMPANY_CAN_READ",
      "REGISTRY_CAN_READ",
      "BSD_CAN_CREATE",
      "BSD_CAN_UPDATE",
      "BSD_CAN_SIGN_EMISSION",
      "BSD_CAN_SIGN_WORK",
      "BSD_CAN_SIGN_TRANSPORT",
      "BSD_CAN_SIGN_DELIVERY",
      "BSD_CAN_SIGN_ACCEPTATION",
      "BSD_CAN_SIGN_OPERATION",
      "BSD_CAN_DELETE",
      "BSD_CAN_REVISE",
      "REGISTRY_CAN_IMPORT"
    ]);
  });
});
