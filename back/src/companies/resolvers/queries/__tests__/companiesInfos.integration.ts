import { Company } from "@prisma/client";
import {
  companyFactory,
  siretify,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Query,
  QueryCompaniesInfosArgs
} from "../../../../generated/graphql/types";

const COMPANIES_INFOS = gql`
  query CompaniesInfos($orgIds: [String!]!) {
    companiesInfos(orgIds: $orgIds) {
      siret
      name
    }
  }
`;

const mockGetPublicCompanyInfos = jest.fn();
jest.mock("../companyInfos", () => ({
  __esModule: true,
  ...jest.requireActual("../companyInfos"),
  getPublicCompanyInfos: (...args) => mockGetPublicCompanyInfos(...args)
}));

describe("companiesInfos", () => {
  let query: ReturnType<typeof makeClient>["query"];
  let companies: Company[] = [];
  let vatCompany: Company;

  beforeAll(async () => {
    const testClient = makeClient();
    query = testClient.query;

    // Create a bunch of companies
    for (let i = 0; i < 101; i++) {
      const company = await companyFactory();
      companies.push(company);
    }

    // Create one company with a vatNumber
    vatCompany = await companyFactory({ vatNumber: "BE0541696005" });
    companies.push(vatCompany);

    // Return persisted companies
    mockGetPublicCompanyInfos.mockImplementation(orgId =>
      companies.find(c => c.orgId === orgId)
    );
  });

  afterAll(async () => {
    await resetDatabase();
    mockGetPublicCompanyInfos.mockReset();
  });

  it("user should be logged in", async () => {
    // Given

    // When
    const { errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: companies.slice(0, 100).map(c => c.orgId)
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
  });

  it("should return companies data", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: companies.slice(0, 100).map(c => c.orgId)
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.companiesInfos?.length).toEqual(100);
  });

  it("should return error if 100+ orgIds", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: companies.slice(0, 101).map(c => c.orgId)
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "orgIds field must have less than or equal to 100 items"
    );
  });

  it("should accept 100- orgIds", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: companies.slice(0, 10).map(c => c.orgId)
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.companiesInfos?.length).toEqual(10);
  });

  it("should error if not at least 1 orgId", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: []
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("orgIds field must have at least 1 items");
  });

  it("should not accept invalid orgIds", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: ["not-an-orgId"]
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("'not-an-orgId' n'est pas un orgId valide");
  });

  it("should de-duplicate orgIds", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: [companies[0].orgId, companies[0].orgId]
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.companiesInfos?.length).toEqual(1);
  });

  it("should work with VAT numbers too", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: [companies[0].orgId, vatCompany.vatNumber]
      }
    });

    console.log("[companies[0].orgId, vatCompany.vatNumber]", [
      companies[0].orgId,
      vatCompany.vatNumber
    ]);

    // Then
    expect(errors).toBeUndefined();
    expect(data.companiesInfos?.length).toEqual(2);
  });

  it("if siret does not exist, should not throw", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<
      Pick<Query, "companiesInfos">,
      QueryCompaniesInfosArgs
    >(COMPANIES_INFOS, {
      variables: {
        orgIds: [companies[0].orgId, siretify(0)]
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.companiesInfos?.length).toEqual(1);
  });
});
