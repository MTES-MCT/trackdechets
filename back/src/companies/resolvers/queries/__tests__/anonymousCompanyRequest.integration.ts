import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Query,
  QueryAnonymousCompanyRequestArgs
} from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../../../libs/back/prisma/src";

const ANONYMOUS_COMPANY_REQUEST = gql`
  query AnonymousCompanyRequest($id: ID!) {
    anonymousCompanyRequest(id: $id) {
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
`;

const REQUEST_1 = {
  address: "4 BD PASTEUR 44100 NANTES",
  codeNaf: "6202A",
  name: "ACME CORP",
  pdf: "[pdf1 in base64]",
  siret: "98254982600013"
};

describe("anonymousCompanyRequest", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    // Given
    const user = await userFactory({ isAdmin: false });

    // When
    const { query } = makeClient(user);
    const { errors } = await query(ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        id: "1"
      }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should return targeted anonymousCompanyRequest", async () => {
    // Given
    const user = await userFactory();
    const admin = await userFactory({ isAdmin: true });

    const request1 = await prisma.anonymousCompanyRequest.create({
      data: { userId: user.id, ...REQUEST_1 }
    });

    // When
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "anonymousCompanyRequest">,
      QueryAnonymousCompanyRequestArgs
    >(ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        id: request1.id
      }
    });

    // Then
    expect(data.anonymousCompanyRequest).toMatchObject({
      ...request1,
      createdAt: request1.createdAt.toISOString()
    });
  });

  it("should return error if id matches no anonymousCompanyRequest", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });

    // When
    const { query } = makeClient(admin);
    const { errors } = await query<
      Pick<Query, "anonymousCompanyRequest">,
      QueryAnonymousCompanyRequestArgs
    >(ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        id: "1"
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("No AnonymousCompanyRequest found");
  });
});
