import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../__tests__/factories";
import { BsdasriStatus } from "@prisma/client";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";

const CREATE_DASRI = `
mutation DasriCreate($input: BsdasriCreateInput!) {
  createBsdasri(input: $input)  {
    id
    isDraft
    bsdasriType
    status
    emitter {
      company {
         siret
        }
    }
    regroupedBsdasris
    synthesizedBsdasris
  }
}
`;

describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should build a synthesis dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });

    const toRegroup1 = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret,
        processingOperation: "D12"
      }
    });

    const toRegroup2 = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret,
        processingOperation: "R12"
      }
    });

    const input = {
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          quantity: { value: 23, type: "REAL" },

          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      synthesizedBsdasris: [{ id: toRegroup1.id }, { id: toRegroup2.id }]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.synthesizedBsdasris).toEqual([
      toRegroup1.id,
      toRegroup2.id
    ]);
    expect(data.createBsdasri.regroupedBsdasris).toEqual([]);
    expect(data.createBsdasri.bsdasriType).toEqual("SYNTHESIS");
    const regrouped1 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    const regrouped2 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    expect(regrouped1.synthesizedOnBsdasriId).toEqual(data.createBsdasri.id);

    expect(regrouped2.synthesizedOnBsdasriId).toEqual(data.createBsdasri.id);
  });
});
