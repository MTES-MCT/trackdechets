import { BspaohStatus, UserRole, WasteAcceptationStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";

import {
  Mutation,
  MutationSignBspaohArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
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

  describe("OPERATION", () => {
    it("should allow destination to sign operation", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bspaoh = await bspaohFactory({
        opt: {
          status: "RECEIVED",
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          destinationCompanySiret: company.siret,

          destinationReceptionAcceptationStatus:
            WasteAcceptationStatus.ACCEPTED,
          destinationReceptionWasteWeightValue: 10,
          destinationReceptionWasteWeightIsEstimate: false,
          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationOperationCode: "R 1",

          destinationOperationDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportSignatureAuthor: "Transporter",
              transporterTransportSignatureDate: new Date(),

              transporterRecepisseIsExempted: null,

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

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.PROCESSED);
      expect(persisted?.destinationOperationSignatureDate).toBeTruthy();
      expect(persisted?.destinationOperationSignatureAuthor).toEqual(user.name);
    });

    it("should disallow destination to sign operation if reception is not signed", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bspaoh = await bspaohFactory({
        opt: {
          status: "SENT",
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          destinationCompanySiret: company.siret,

          destinationReceptionAcceptationStatus:
            WasteAcceptationStatus.ACCEPTED,
          destinationReceptionWasteWeightValue: 10,
          destinationReceptionWasteWeightIsEstimate: false,
          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationOperationCode: "R 1",

          destinationOperationDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportSignatureAuthor: "Transporter",
              transporterTransportSignatureDate: new Date(),

              transporterRecepisseIsExempted: null,

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

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "OPERATION",
            author: user.name
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
