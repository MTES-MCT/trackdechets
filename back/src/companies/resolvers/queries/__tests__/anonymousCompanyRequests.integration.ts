import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Query,
  QueryAnonymousCompanyRequestsArgs
} from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../../../libs/back/prisma/src";

const ANONYMOUS_COMPANY_REQUESTS = gql`
  query AnonymousCompanyRequests($first: Int, $last: Int, $skip: Int) {
    anonymousCompanyRequests(first: $first, last: $last, skip: $skip) {
      totalCount
      anonymousCompanyRequests {
        id
        siret
        pdf
        createdAt
        userId
        name
        codeNaf
        address
      }
    }
  }
`;

const REQUEST_1 = {
  address: "4 BD PASTEUR 44100 NANTES",
  codeNaf: "6202A",
  name: "ACME CORP",
  pdf: "[pdf1 in base64]",
  siret: "98254982600013"
};
const REQUEST_2 = {
  address: "66 rue de la grande allée 91100 Paris",
  codeNaf: "9202Z",
  name: "Google inc.",
  pdf: "[pdf2 in base64]",
  siret: "77254982600018"
};

describe("anonymousCompanyRequests", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    // Given
    const user = await userFactory({ isAdmin: false });

    // When
    const { query } = makeClient(user);
    const { errors } = await query(ANONYMOUS_COMPANY_REQUESTS);

    // Then
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should return the list of anonymousCompanyRequests ordered by createdAt desc", async () => {
    // Given
    const user = await userFactory();
    const admin = await userFactory({ isAdmin: true });
    const request1 = { userId: user.id, ...REQUEST_1 };
    const request2 = { userId: user.id, ...REQUEST_2 };

    await prisma.anonymousCompanyRequest.create({
      data: request1
    });
    await prisma.anonymousCompanyRequest.create({
      data: request2
    });

    // When
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "anonymousCompanyRequests">,
      QueryAnonymousCompanyRequestsArgs
    >(ANONYMOUS_COMPANY_REQUESTS);

    // Then
    expect(data.anonymousCompanyRequests.totalCount).toEqual(2);
    expect(
      data.anonymousCompanyRequests.anonymousCompanyRequests
    ).toMatchObject([request2, request1]);
  });

  it("should return the list of anonymousCompanyRequests paginated", async () => {
    // Given
    const user = await userFactory();
    const admin = await userFactory({ isAdmin: true });
    const request1 = { userId: user.id, ...REQUEST_1 };
    const request2 = { userId: user.id, ...REQUEST_2 };

    await prisma.anonymousCompanyRequest.create({
      data: request1
    });
    await prisma.anonymousCompanyRequest.create({
      data: request2
    });

    // When
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "anonymousCompanyRequests">,
      QueryAnonymousCompanyRequestsArgs
    >(ANONYMOUS_COMPANY_REQUESTS, {
      variables: {
        first: 1,
        skip: 1
      }
    });

    // Then
    expect(data.anonymousCompanyRequests.totalCount).toEqual(2);
    expect(
      data.anonymousCompanyRequests.anonymousCompanyRequests
    ).toMatchObject([request1]);
  });

  it("should return an empty list", async () => {
    // Given
    await userFactory();
    const admin = await userFactory({ isAdmin: true });

    // When
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "anonymousCompanyRequests">,
      QueryAnonymousCompanyRequestsArgs
    >(ANONYMOUS_COMPANY_REQUESTS);

    // Then
    expect(data.anonymousCompanyRequests.totalCount).toEqual(0);
    expect(data.anonymousCompanyRequests.anonymousCompanyRequests).toEqual([]);
  });
});
