import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";

const GET_BSDASRI = `
query GetBsdasri($id: ID!) {
  bsdasri(id: $id) {
    id
    status
    isDraft
    regroupedBsdasris
    emitter {
      onBehalfOfEcoorganisme
      type
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
        quantity
        quantityType
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
        quantity
        quantityType
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
        quantity
        quantityType
      }
      wasteAcceptation {
        status
        refusalReason
        refusedQuantity
      }
    }
    createdAt
    updatedAt
  }
}
`;

describe("Query.Bsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company)
      }
    });

    const { errors } = await query(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company)
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should get a dasri by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company)
      }
    });

    const { query } = makeClient(user);

    const { data } = await query(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
    expect(data.bsdasri.status).toBe("INITIAL");
    expect(data.bsdasri.regroupedBsdasris).toStrictEqual([]);
  });

  it("should retrieve regrouped dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const toRegroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        status: "PROCESSED"
      }
    });
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        regroupedBsdasris: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
    expect(data.bsdasri.regroupedBsdasris).toStrictEqual([toRegroup.id]);
  });
});
