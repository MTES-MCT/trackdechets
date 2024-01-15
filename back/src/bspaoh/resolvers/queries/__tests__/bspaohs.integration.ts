import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bspaohFactory } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { BspaohStatus } from "@prisma/client";

import { fullBspaoh } from "../../../fragments";
import { gql } from "graphql-tag";

const GET_BSPAOHS = gql`
  ${fullBspaoh}
  query bsPaohs($where: BspaohWhere) {
    bspaohs(where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      edges {
        node {
          ...FullBspaoh
        }
      }
    }
  }
`;
describe("Query.Bspaohs", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();

    await bspaohFactory({});

    const { errors } = await query<Pick<Query, "bspaohs">>(GET_BSPAOHS);
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should return an empty list if requested sirets do not belong to user", async () => {
    await bspaohFactory({});

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaohs">>(GET_BSPAOHS, {
      variables: {
        where: { emitter: { company: { siret: { _eq: company.siret } } } }
      }
    });

    expect(data.bspaohs.totalCount).toEqual(0);
  });

  it("should return user bspaohs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const paoh1 = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const paoh2 = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const paoh3 = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaohs">>(GET_BSPAOHS);

    const ids = data.bspaohs.edges.map(edge => edge.node.id);
    expect(ids.length).toBe(3);

    expect(ids.includes(paoh1.id)).toBe(true);
    expect(ids.includes(paoh2.id)).toBe(true);
    expect(ids.includes(paoh3.id)).toBe(true);
    expect(data.bspaohs.totalCount).toEqual(3);
    expect(data.bspaohs.pageInfo.startCursor).toBe(paoh3.id);
    expect(data.bspaohs.pageInfo.endCursor).toBe(paoh1.id);
    expect(data.bspaohs.pageInfo.hasNextPage).toBe(false);
    // check transporters are populated
    const trsSirets = data.bspaohs.edges
      .map(edge => edge.node.transporter?.company?.siret)
      .filter(Boolean);

    expect(trsSirets.length).toBe(3);
  });

  it("should not return deleted bspaohs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const paoh1 = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    await bspaohFactory({
      opt: {
        isDeleted: true,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaohs">>(GET_BSPAOHS);

    const ids = data.bspaohs.edges.map(edge => edge.node.id);
    expect(ids.length).toBe(1);
    expect(data.bspaohs.totalCount).toEqual(1);
    expect(ids.includes(paoh1.id)).toBe(true);
  });

  it("should handle drafts bspaohs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // this bsd was created by user and canAccessDraftSirets contains their siret
    const paoh1 = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });
    // this bsd was not created by user and canAccessDraftSirets does not contains their siret
    const paoh2 = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaohs">>(GET_BSPAOHS, {
      variables: {
        where: { emitter: { company: { siret: { _eq: company.siret } } } }
      }
    });

    const ids = data.bspaohs.edges.map(edge => edge.node.id);
    expect(ids.length).toBe(1);
    // only bspaoh1 is returned
    expect(ids.includes(paoh1.id)).toBe(true);
    expect(ids.includes(paoh2.id)).toBe(false);
  });

  it("should return filtered bspaohs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await bspaohFactory({});
    const paoh2 = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const paoh3 = await bspaohFactory({
      opt: {
        destinationCompanySiret: company.siret
      }
    });
    const paoh4 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { query } = makeClient(user);

    // query retrieves paoh with emitter siret
    const { data: queryEmitter } = await query<Pick<Query, "bspaohs">>(
      GET_BSPAOHS,
      {
        variables: {
          where: {
            emitter: {
              company: { siret: { _eq: company.siret } }
            }
          }
        }
      }
    );

    const queryEmitterIds = queryEmitter.bspaohs.edges.map(
      edge => edge.node.id
    );
    expect(queryEmitterIds).toStrictEqual([paoh2.id]);

    // query retrieves paoh with transporter siret
    const { data: queryTransporter } = await query<Pick<Query, "bspaohs">>(
      GET_BSPAOHS,
      {
        variables: {
          where: {
            transporter: {
              company: { siret: { _eq: company.siret } }
            }
          }
        }
      }
    );

    const queryTransporterIds = queryTransporter.bspaohs.edges.map(
      edge => edge.node.id
    );

    expect(queryTransporterIds).toStrictEqual([paoh4.id]);

    // query retrieves paoh with destination siret
    const { data: queryDestination } = await query<Pick<Query, "bspaohs">>(
      GET_BSPAOHS,
      {
        variables: {
          where: {
            destination: {
              company: { siret: { _eq: company.siret } }
            }
          }
        }
      }
    );

    const queryDestinationIds = queryDestination.bspaohs.edges.map(
      edge => edge.node.id
    );

    expect(queryDestinationIds).toStrictEqual([paoh3.id]);
  });
});
