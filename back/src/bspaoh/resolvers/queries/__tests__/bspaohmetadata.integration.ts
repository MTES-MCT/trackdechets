import { UserRole, BspaohStatus } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import { bspaohFactory } from "../../../__tests__/factories";

const GET_BSPAOH = gql`
  query GetBpaoh($id: ID!) {
    bspaoh(id: $id) {
      id
      status
      metadata {
        fields {
          sealed {
            name
          }
        }
      }
    }
  }
`;

describe("Query.Bspaoh", () => {
  afterEach(resetDatabase);

  it("should return INITIAL bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.INITIAL,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(0);
  });

  it("should return SIGNED_BY_PRODUCER bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(25);
  });

  it("should return SENT bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.SENT,

        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            transporterTransportSignatureDate: new Date(),
            number: 1
          }
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(41);
  });
  it("should return RECEIVED bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureDate: new Date()
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(48);
  });

  it("should return PROCESSED bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.PROCESSED,
        emitterCompanySiret: company.siret,
        destinationOperationSignatureDate: new Date()
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(51);
  });
});
