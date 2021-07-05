import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";

const GET_BSDASRIS = `
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
        id
        status
        emitter {
          company {
            name
            siret
          }
          workSite {
            name
            address
            city
            postalCode
          }
        }
        emission {
          wasteCode

          wasteDetails {
            onuCode
            volume
            quantity { value type}
    
          }
          handedOverAt
          signature {
            author
            date
          }
        }

        transporter {
          company {
            siret
          }
        }
        transport {
          handedOverAt
          takenOverAt
          wasteDetails {
            quantity { value type}
 
            volume
          }
          wasteAcceptation {
            status
            refusalReason

            refusedQuantity
          }
          signature {
            author
            date
          }
        }
        recipient {
          company {
            name
            siret
          }
        }
        reception {
          wasteDetails {
            volume
          }
          wasteAcceptation {
            status
            refusalReason

            refusedQuantity
          }
          signature {
            author
            date
          }
        }
        operation {
          quantity { value }
          processingOperation
          processedAt
        }
        createdAt
        updatedAt
      }
    }
  }
}

`;

describe("Query.Bsdasris", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await bsdasriFactory({
      ownerId: user.id,
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
    const { user: otherUser, company } = await userWithCompanyFactory("MEMBER");
    const params = {
      ownerId: otherUser.id,
      opt: {
        ...initialData(company)
      }
    };
    await bsdasriFactory(params);

    const { user } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: { transporter: { company: { siret: "9999" } } }
      }
    });

    expect(data.bsdasris.totalCount).toEqual(0);
  });

  it("should get user dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const params = {
      ownerId: user.id,
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
    const recipientCompany = await companyFactory();

    await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company)
      }
    });
    const dasri2 = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        transporterCompanySiret: transporterCompany.siret
      }
    });

    // let's create a dasri with specific recipient to filter on its siret
    const dasri3 = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { query } = makeClient(user);

    // retrieve dasris where transporter is otherCompany
    const { data: queryTransporter } = await query<Pick<Query, "bsdasris">>(
      GET_BSDASRIS,
      {
        variables: {
          where: {
            transporter: { company: { siret: transporterCompany.siret } }
          }
        }
      }
    );
    const queryTransporterIds = queryTransporter.bsdasris.edges.map(
      edge => edge.node.id
    );

    expect(queryTransporterIds).toStrictEqual([dasri2.id]);

    // retrieve dasris where recipient is otherCompany
    const { data: queryRecipient } = await query<Pick<Query, "bsdasris">>(
      GET_BSDASRIS,
      {
        variables: {
          where: { recipient: { company: { siret: recipientCompany.siret } } }
        }
      }
    );
    const queryRecipientIids = queryRecipient.bsdasris.edges.map(
      edge => edge.node.id
    );

    expect(queryRecipientIids).toStrictEqual([dasri3.id]);
  });
});
