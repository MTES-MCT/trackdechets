import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../__tests__/factories";
import { BsdasriStatus } from "@prisma/client";
import prisma from "../../../../prisma";

const CREATE_DASRI = `
mutation DasriCreate($input: BsdasriCreateInput!) {
  createBsdasri(bsdasriCreateInput: $input)  {
    id
    isDraft
    status
    emitter {
      company {
         siret
        }
    }
    regroupedBsdasris 
  }
}
`;
describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("forbids non collectors to regroup dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const toRegroup1 = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret
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
          quantity: 23,
          quantityType: "REAL",
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
      regroupedBsdasris: [{ id: toRegroup1.id }]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_DASRI, {
      variables: {
        input
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le siret de l'émetteur n'est pas autorisé à regrouper des dasris",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("forbids dasris with wrong operation code to be regrouped", async () => {
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
        processingOperation: "R1"
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
          quantity: 23,
          quantityType: "REAL",
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
      regroupedBsdasris: [{ id: toRegroup1.id }]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_DASRI, {
      variables: {
        input
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les dasris suivants ne peuvent pas être regroupés ${toRegroup1.id}`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should build a regroupment dasri", async () => {
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
          quantity: 23,
          quantityType: "REAL",
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
      regroupedBsdasris: [{ id: toRegroup1.id }, { id: toRegroup2.id }]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_DASRI, {
      variables: {
        input
      }
    });
    expect(data.createBsdasri.regroupedBsdasris).toEqual([
      toRegroup1.id,
      toRegroup2.id
    ]);

    const regrouped1 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    const regrouped2 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    expect(regrouped1.regroupedOnBsdasriId).toEqual(data.createBsdasri.id);

    expect(regrouped2.regroupedOnBsdasriId).toEqual(data.createBsdasri.id);
  });
});
