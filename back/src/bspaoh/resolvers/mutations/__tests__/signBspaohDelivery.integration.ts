import { BspaohStatus, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";

import type { Mutation, MutationSignBspaohArgs } from "@td/codegen-back";

import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";

import { gql } from "graphql-tag";
import { fullBspaoh } from "../../../fragments";

const SIGN_BSPAOH = gql`
  mutation SignBspaoh($id: ID!, $input: BspaohSignatureInput!) {
    signBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.Bspaoh.sign", () => {
  afterEach(resetDatabase);

  describe("DELIVERY", () => {
    it("should allow transporter to sign delivery", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SENT,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "DELIVERY",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
    });

    it("should disallow transporter to sign transport when bspaoh is not SENT", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: transporterReceipt.receiptNumber,
              transporterRecepisseDepartment: transporterReceipt.department,
              transporterRecepisseValidityLimit:
                transporterReceipt.validityLimit,
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });
      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "DELIVERY",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Vous ne pouvez pas apposer cette signature sur le bordereau.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    });
  });
});
