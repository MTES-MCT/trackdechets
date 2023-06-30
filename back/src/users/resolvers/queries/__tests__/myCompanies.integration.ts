import { gql } from "apollo-server-express";
import makeClient from "../../../../__tests__/testClient";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { associateUserToCompany } from "../../../database";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { AuthType } from "../../../../auth";
import { subDays } from "date-fns";

const MY_COMPANIES = gql`
  query MyCompanies(
    $first: Int
    $after: ID
    $last: Int
    $before: ID
    $search: String
  ) {
    myCompanies(
      first: $first
      after: $after
      last: $last
      before: $before
      search: $search
    ) {
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
          siret
          givenName
          name
          users {
            email
            name
          }
          userRole
          userPermissions
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
    expect(data!.myCompanies.totalCount).toEqual(1);
    expect(data!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id
    ]);
  }, 20000);

  it("should paginate forward with first and after", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ givenName: "A" });
    const company2 = await companyFactory({ givenName: "B" });
    const company3 = await companyFactory({ givenName: "C" });
    const company4 = await companyFactory(); // record without given name should be last
    for (const company of [company1, company2, company3, company4]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { first: 3 }
      }
    );
    expect(page1!.myCompanies.totalCount).toEqual(4);
    expect(page1!.myCompanies.pageInfo.hasPreviousPage).toEqual(false);
    expect(page1!.myCompanies.pageInfo.hasNextPage).toEqual(true);
    expect(page1!.myCompanies.pageInfo.endCursor).toEqual(company3.id);
    expect(page1!.myCompanies.pageInfo.startCursor).toEqual(company1.id);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id,
      company2.id,
      company3.id
    ]);
    const { data: page2 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { first: 3, after: page1!.myCompanies.pageInfo.endCursor }
      }
    );
    expect(page2!.myCompanies.totalCount).toEqual(4);
    expect(page2!.myCompanies.pageInfo.hasPreviousPage).toEqual(true);
    expect(page2!.myCompanies.pageInfo.hasNextPage).toEqual(false);
    expect(page2!.myCompanies.pageInfo.endCursor).toEqual(company4.id);
    expect(page2!.myCompanies.pageInfo.startCursor).toEqual(company4.id);
    expect(page2!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company4.id
    ]);
  }, 20000);

  it("should paginate backward with last and before", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ givenName: "A" });
    const company2 = await companyFactory({ givenName: "B" });
    const company3 = await companyFactory({ givenName: "C" });
    const company4 = await companyFactory(); // record without given name should be last

    for (const company of [company1, company2, company3, company4]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3 }
      }
    );

    expect(page1!.myCompanies.totalCount).toEqual(4);
    expect(page1!.myCompanies.pageInfo.hasPreviousPage).toEqual(true);
    expect(page1!.myCompanies.pageInfo.hasNextPage).toEqual(false);
    expect(page1!.myCompanies.pageInfo.endCursor).toEqual(company4.id);
    expect(page1!.myCompanies.pageInfo.startCursor).toEqual(company2.id);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company2.id,
      company3.id,
      company4.id
    ]);
    const { data: page2 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, before: page1!.myCompanies.pageInfo.startCursor }
      }
    );

    expect(page2!.myCompanies.totalCount).toEqual(4);
    expect(page2!.myCompanies.pageInfo.hasPreviousPage).toEqual(false);
    expect(page2!.myCompanies.pageInfo.hasNextPage).toEqual(true);
    expect(page2!.myCompanies.pageInfo.endCursor).toEqual(company1.id);
    expect(page2!.myCompanies.pageInfo.startCursor).toEqual(company1.id);
    expect(page2!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id
    ]);
  }, 20000);

  it("should disallow search parameter for user authenticated through API", async () => {
    const user = await userFactory();
    const { query } = makeClient({ ...user, auth: AuthType.Bearer });
    const { errors } = await query<Pick<Query, "myCompanies">>(MY_COMPANIES, {
      variables: { search: "az" }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le paramètre de recherche "search" est réservé à usage interne et n'est pas disponible via l'api.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should raise an error on short search clues", async () => {
    const user = await userFactory();

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "myCompanies">>(MY_COMPANIES, {
      variables: { last: 3, search: "az" }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le paramètre de recherche doit être compris entre 3 et 20 caractères.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  }, 20000);

  it("should raise an error on long search clues", async () => {
    const user = await userFactory();

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "myCompanies">>(MY_COMPANIES, {
      variables: { last: 3, search: "123456789012345678901" }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le paramètre de recherche doit être compris entre 3 et 20 caractères.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  }, 20000);

  it("should return companies with the search parameter filtering on the name", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ name: "Banque" });
    const company2 = await companyFactory({ name: "Boulangerie" });
    const company3 = await companyFactory({ name: "Déchetterie" });

    for (const company of [company1, company2, company3]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, search: "boulan" }
      }
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company2.id
    ]);
  }, 20000);

  it("should return companies with the search parameter filtering on the given name", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ givenName: "Site de Paris" });
    const company2 = await companyFactory({ givenName: "Site de Toulon" });
    const company3 = await companyFactory({ givenName: "Site de Marseille" });

    for (const company of [company1, company2, company3]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, search: "Toulon" }
      }
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company2.id
    ]);
  }, 20000);

  it("should return companies with the search parameter filtering on the siret", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ name: "Banque" });
    const company2 = await companyFactory({ name: "Banque" });
    const company3 = await companyFactory({ name: "Banque" });

    for (const company of [company1, company2, company3]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, search: company3.siret }
      }
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company3.id
    ]);
  }, 20000);

  it("should return companies with the search parameter filtering on the vatNumber", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ vatNumber: "BE123456" });
    const company2 = await companyFactory({ vatNumber: "DE654321" });
    const company3 = await companyFactory({ vatNumber: "ES987543" });

    for (const company of [company1, company2, company3]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { last: 3, search: "DE654321" }
      }
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company2.id
    ]);
  }, 20000);

  it("should paginate search forward with first and after", async () => {
    const user = await userFactory();
    const company1 = await companyFactory({ name: "Banque Lorient" });
    const company2 = await companyFactory({ name: "Boulangerie Lorient" });
    const company3 = await companyFactory({ name: "Déchetterie Lorient" });
    const company4 = await companyFactory({ name: "Confiserie Lorient" });

    for (const company of [company1, company2, company3, company4]) {
      await associateUserToCompany(user.id, company.orgId, "MEMBER");
    }
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: { first: 3, search: "Lorient" }
      }
    );
    expect(page1!.myCompanies.totalCount).toEqual(4);
    expect(page1!.myCompanies.pageInfo.hasPreviousPage).toEqual(false);
    expect(page1!.myCompanies.pageInfo.hasNextPage).toEqual(true);
    expect(page1!.myCompanies.pageInfo.endCursor).toEqual(company3.id);
    expect(page1!.myCompanies.pageInfo.startCursor).toEqual(company1.id);
    expect(page1!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company1.id,
      company2.id,
      company3.id
    ]);
    const { data: page2 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES,
      {
        variables: {
          first: 3,
          after: page1!.myCompanies.pageInfo.endCursor,
          search: "Lorient"
        }
      }
    );
    expect(page2!.myCompanies.totalCount).toEqual(4);
    expect(page2!.myCompanies.pageInfo.hasPreviousPage).toEqual(true);
    expect(page2!.myCompanies.pageInfo.hasNextPage).toEqual(false);
    expect(page2!.myCompanies.pageInfo.endCursor).toEqual(company4.id);
    expect(page2!.myCompanies.pageInfo.startCursor).toEqual(company4.id);
    expect(page2!.myCompanies.edges.map(({ node }) => node.id)).toEqual([
      company4.id
    ]);
  }, 20000);

  it("should not obfuscate user name when association comes from an older accepted invitation", async () => {
    const user = await userFactory();
    const member = await userFactory();
    const company = await companyFactory();

    await associateUserToCompany(user.id, company.orgId, "ADMIN");
    // association created 8 days ago - no more name obfuscation
    await associateUserToCompany(member.id, company.orgId, "MEMBER", {
      automaticallyAccepted: true,
      createdAt: subDays(new Date(), 8)
    });

    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);

    const userNames = page1!.myCompanies.edges[0].node.users
      ?.filter(u => u.email !== user.email)
      .map(u => u.name);
    expect(userNames?.length).toBe(1);
    expect(userNames).toStrictEqual([member.name]);
  }, 20000);

  it("should obfuscate user name when association comes from a recent automatically accepted invitation", async () => {
    const user = await userFactory();
    const member = await userFactory();
    const company = await companyFactory();

    await associateUserToCompany(user.id, company.orgId, "ADMIN");
    // association created 2 days ago - name obfuscation
    await associateUserToCompany(member.id, company.orgId, "MEMBER", {
      automaticallyAccepted: true,
      createdAt: subDays(new Date(), 2)
    });

    // requesting user is not the invited user, their name is obfuscated during several days
    const { query } = makeClient(user);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);

    const userNames = page1!.myCompanies.edges[0].node.users
      ?.filter(u => u.email !== user.email)
      .map(u => u.name);
    expect(userNames?.length).toBe(1);
    expect(userNames).toStrictEqual(["Temporairement masqué"]);
  }, 20000);

  it("should not obfuscate user name for themselves", async () => {
    const user = await userFactory();
    const member = await userFactory();
    const company = await companyFactory();

    await associateUserToCompany(user.id, company.orgId, "ADMIN");
    // association created 2 days ago - name obfuscation
    await associateUserToCompany(member.id, company.orgId, "MEMBER", {
      automaticallyAccepted: true,
      createdAt: subDays(new Date(), 2)
    });

    const { query } = makeClient(member);
    const { data: page1 } = await query<Pick<Query, "myCompanies">>(
      MY_COMPANIES
    );

    expect(page1!.myCompanies.totalCount).toEqual(1);

    const userNames = page1!.myCompanies.edges[0].node.users
      ?.filter(u => u.email !== user.email)
      .map(u => u.name);
    expect(userNames?.length).toBe(1);
    expect(userNames).toStrictEqual([member.name]);
  }, 20000);

  it("should return userRole and userPermissions", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "myCompanies">>(MY_COMPANIES);
    expect(data.myCompanies.edges).toHaveLength(1);
    expect(data.myCompanies.edges[0].node.siret).toEqual(company.siret);
    expect(data.myCompanies.edges[0].node.userRole).toEqual("MEMBER");
    expect(data.myCompanies.edges[0].node.userPermissions).toEqual([
      "BSD_CAN_READ",
      "BSD_CAN_LIST",
      "COMPANY_CAN_READ",
      "REGISTRY_CAN_READ",
      "BSD_CAN_CREATE",
      "BSD_CAN_UPDATE",
      "BSD_CAN_SIGN_EMISSION",
      "BSD_CAN_SIGN_WORK",
      "BSD_CAN_SIGN_TRANSPORT",
      "BSD_CAN_SIGN_ACCEPTATION",
      "BSD_CAN_SIGN_OPERATION",
      "BSD_CAN_DELETE",
      "BSD_CAN_REVISE"
    ]);
  });
});
