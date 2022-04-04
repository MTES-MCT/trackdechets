import { gql } from "apollo-server-express";
import makeClient from "../../../../__tests__/testClient";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { Query } from "@trackdechets/codegen/src/back.gen";
import { associateUserToCompany } from "../../../database";
import { resetDatabase } from "../../../../../integration-tests/helper";

const MY_COMPANIES = gql`
  query MyCompanies($first: Int, $after: ID, $last: Int, $before: ID) {
    myCompanies(first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      totalCount
      edges {
        cursor
        node {
          id
          givenName
          name
        }
      }
    }
  }
`;

describe("query { myCompanies }", () => {
  afterAll(resetDatabase);

  it("should deny access to unauthenticated users", async () => {
    const { query } = makeClient();
    const { errors } = await query(MY_COMPANIES);
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should not return other user's companies", async () => {
    const { user: user1, company: company1 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: _user2, company: _company2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { query } = makeClient(user1);
    const { data } = await query<Pick<Query, "myCompanies">>(MY_COMPANIES);
    expect(data.myCompanies.totalCount).toEqual(1);
    expect(data.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id
    ]);
  });

  it("should paginate forward with first and after", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ givenName: "A" });
    const company2 = await companyFactory({ givenName: "B" });
    const company3 = await companyFactory({ givenName: "C" });
    const company4 = await companyFactory(); // record without given name should be last
    for (const company of [company1, company2, company3, company4]) {
      await associateUserToCompany(user.id, company.siret, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { first: 3 }
      }
    );
    expect(page1.myCompanies.totalCount).toEqual(4);
    expect(page1.myCompanies.pageInfo.hasPreviousPage).toEqual(false);
    expect(page1.myCompanies.pageInfo.hasNextPage).toEqual(true);
    expect(page1.myCompanies.pageInfo.endCursor).toEqual(company3.id);
    expect(page1.myCompanies.pageInfo.startCursor).toEqual(company1.id);
    expect(page1.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id,
      company2.id,
      company3.id
    ]);
    const { data: page2 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { first: 3, after: page1.myCompanies.pageInfo.endCursor }
      }
    );
    expect(page2.myCompanies.totalCount).toEqual(4);
    expect(page2.myCompanies.pageInfo.hasPreviousPage).toEqual(true);
    expect(page2.myCompanies.pageInfo.hasNextPage).toEqual(false);
    expect(page2.myCompanies.pageInfo.endCursor).toEqual(company4.id);
    expect(page2.myCompanies.pageInfo.startCursor).toEqual(company4.id);
    expect(page2.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company4.id
    ]);
  });

  it("should paginate backward with last and before", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ givenName: "A" });
    const company2 = await companyFactory({ givenName: "B" });
    const company3 = await companyFactory({ givenName: "C" });
    const company4 = await companyFactory(); // record without given name should be last

    for (const company of [company1, company2, company3, company4]) {
      await associateUserToCompany(user.id, company.siret, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3 }
      }
    );

    expect(page1.myCompanies.totalCount).toEqual(4);
    expect(page1.myCompanies.pageInfo.hasPreviousPage).toEqual(true);
    expect(page1.myCompanies.pageInfo.hasNextPage).toEqual(false);
    expect(page1.myCompanies.pageInfo.endCursor).toEqual(company4.id);
    expect(page1.myCompanies.pageInfo.startCursor).toEqual(company2.id);
    expect(page1.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company2.id,
      company3.id,
      company4.id
    ]);
    const { data: page2 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, before: page1.myCompanies.pageInfo.startCursor }
      }
    );

    expect(page2.myCompanies.totalCount).toEqual(4);
    expect(page2.myCompanies.pageInfo.hasPreviousPage).toEqual(false);
    expect(page2.myCompanies.pageInfo.hasNextPage).toEqual(true);
    expect(page2.myCompanies.pageInfo.endCursor).toEqual(company1.id);
    expect(page2.myCompanies.pageInfo.startCursor).toEqual(company1.id);
    expect(page2.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id
    ]);
  });
});
