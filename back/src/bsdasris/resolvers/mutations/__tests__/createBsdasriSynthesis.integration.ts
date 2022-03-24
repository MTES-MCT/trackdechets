import { resetDatabase } from "../../../../../integration-tests/helper";

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

  it("should build a synthesis dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: "1234",
        transporterCompanySiret: company.siret,
        destinationCompanySiret: "9876",
        destinationOperationCode: "D9"
      }
    });

    const toAssociate2 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: "7654",
        transporterCompanySiret: company.siret,
        destinationCompanySiret: "2689",
        destinationOperationCode: "D10"
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },
      emitter: {
        company: {
          name: "le transporteur",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
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
      transporter: {
        company: {
          name: "le transporteur",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
          address: "avenue de la mer"
        }
      },

      synthesizing: [toAssociate1.id, toAssociate2.id]
    };

    const { mutate } = makeClient(user);
    const res = await mutate<Pick<Mutation, "createBsdasri">>(CREATE_DASRI, {
      variables: {
        input
      }
    });

    const { data } = res;
    expect(data.createBsdasri.synthesizing.map(bsd => bsd.id)).toEqual([
      toAssociate1.id,
      toAssociate2.id
    ]);
    expect(data.createBsdasri.type).toEqual("SYNTHESIS");
    const grouped1 = await prisma.bsdasri.findUnique({
      where: { id: toAssociate1.id }
    });
    const grouped2 = await prisma.bsdasri.findUnique({
      where: { id: toAssociate2.id }
    });
    expect(grouped1.synthesizedInId).toEqual(data.createBsdasri.id);

    expect(grouped2.synthesizedInId).toEqual(data.createBsdasri.id);
  });
});
