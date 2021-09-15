import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { fullBsdasriFragment } from "../../../fragments";
import { gql } from "apollo-server-express";

const GET_BSDASRIS = gql`
  ${fullBsdasriFragment}
  query bsDasris($where: BsdasriWhere) {
    bsdasris(where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      edges {
        node {
          ...FullBsdasriFragment
        }
      }
    }
  }
`;

describe("Query.Bsdasris", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");

    await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { errors } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS);
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
    const { company } = await userWithCompanyFactory("MEMBER");
    const params = {
      opt: {
        ...initialData(company)
      }
    };
    await bsdasriFactory(params);

    const { user } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: { transporter: { company: { siret: { _eq: "9999" } } } }
      }
    });

    expect(data.bsdasris.totalCount).toEqual(0);
  });

  it("should get user dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const params = {
      opt: {
        ...initialData(company)
      }
    };
    const dasri1 = await bsdasriFactory(params);
    const dasri2 = await bsdasriFactory(params);
    const dasri3 = await bsdasriFactory(params);

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS);
    const ids = data.bsdasris.edges.map(edge => edge.node.id);
    expect(ids.length).toBe(3);

    expect(ids.includes(dasri1.id)).toBe(true);
    expect(ids.includes(dasri2.id)).toBe(true);
    expect(ids.includes(dasri3.id)).toBe(true);

    expect(data.bsdasris.totalCount).toBe(3);
    expect(data.bsdasris.pageInfo.startCursor).toBe(dasri3.id);
    expect(data.bsdasris.pageInfo.endCursor).toBe(dasri1.id);
    expect(data.bsdasris.pageInfo.hasNextPage).toBe(false);
  });

  it("should get filtered dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const destinationCompany = await companyFactory();

    await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });
    const dasri2 = await bsdasriFactory({
      opt: {
        ...initialData(company),
        transporterCompanySiret: transporterCompany.siret
      }
    });

    // let's create a dasri with specific recipient to filter on its siret
    const dasri3 = await bsdasriFactory({
      opt: {
        ...initialData(company),
        destinationCompanySiret: destinationCompany.siret
      }
    });

    const { query } = makeClient(user);

    // retrieve dasris where transporter is otherCompany
    const { data: queryTransporter } = await query<Pick<Query, "bsdasris">>(
      GET_BSDASRIS,
      {
        variables: {
          where: {
            transporter: {
              company: { siret: { _eq: transporterCompany.siret } }
            }
          }
        }
      }
    );
    const queryTransporterIds = queryTransporter.bsdasris.edges.map(
      edge => edge.node.id
    );

    expect(queryTransporterIds).toStrictEqual([dasri2.id]);

    // retrieve dasris where recipient is otherCompany
    const { data: queryDestination } = await query<Pick<Query, "bsdasris">>(
      GET_BSDASRIS,
      {
        variables: {
          where: {
            destination: {
              company: { siret: { _eq: destinationCompany.siret } }
            }
          }
        }
      }
    );
    const queryDestinationIds = queryDestination.bsdasris.edges.map(
      edge => edge.node.id
    );

    expect(queryDestinationIds).toStrictEqual([dasri3.id]);
  });

  it("should get dasris which id are requested", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });
    const dasri2 = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const dasri3 = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { query } = makeClient(user);

    // retrieve dasris which ids are requested
    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: {
          id: { _in: [dasri2.id, dasri3.id] }
        }
      }
    });
    const ids = data.bsdasris.edges.map(edge => edge.node.id);

    expect(ids.length).toEqual(2);
    expect(ids).toContain(dasri2.id);
    expect(ids).toContain(dasri3.id);
  });
});
