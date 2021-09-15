import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../__tests__/factories";
import { BsdasriStatus } from "@prisma/client";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { gql } from "apollo-server-express";
import { fullGroupingBsdasriFragment } from "../../../fragments";

const CREATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation DasriCreate($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      ...FullGroupingBsdasriFragment
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
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        destinationCompanySiret: company.siret
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      grouping: [toRegroup1.id]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
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
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        destinationCompanySiret: company.siret,
        destinationOperationCode: "R1"
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      grouping: [toRegroup1.id]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
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
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        destinationCompanySiret: company.siret,
        destinationOperationCode: "D12"
      }
    });

    const toRegroup2 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        destinationCompanySiret: company.siret,
        destinationOperationCode: "R12"
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      grouping: [toRegroup1.id, toRegroup2.id]
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

    expect(data.createBsdasri.grouping.map(bsd => bsd.id)).toEqual([
      toRegroup1.id,
      toRegroup2.id
    ]);
    expect(data.createBsdasri.type).toEqual("GROUPING");
    const grouped1 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    const grouped2 = await prisma.bsdasri.findUnique({
      where: { id: toRegroup1.id }
    });
    expect(grouped1.groupedInId).toEqual(data.createBsdasri.id);

    expect(grouped2.groupedInId).toEqual(data.createBsdasri.id);
  });
});
