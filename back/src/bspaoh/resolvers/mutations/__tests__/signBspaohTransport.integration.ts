import { BspaohStatus, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";

import {
  Mutation,
  MutationSignBspaohArgs
} from "../../../../generated/graphql/types";

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

  describe("TRANSPORT", () => {
    it("should allow transporter to sign transport when exempted of receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterRecepisseIsExempted: true,
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
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
    });

    it("should allow transporter to sign transport and auto-complete the receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const receipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: true,
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
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
      expect(data.signBspaoh.transporter?.recepisse?.department).toBe(
        receipt.department
      );
      expect(data.signBspaoh.transporter?.recepisse?.number).toBe(
        receipt.receiptNumber
      );
      expect(data.signBspaoh.transporter?.recepisse?.validityLimit).toBe(
        receipt.validityLimit.toISOString()
      );
    });
    it("should disallow transporter to sign transport if plates are missing and mode is ROAD", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: true,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: [],
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
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            "La plaque d'immatriculation est requise"
          )
        })
      ]);
    });

    it("should disallow transporter to sign transport when recepisse is missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: null,
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
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            "Transporteur: le numéro de récépissé est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          )
        })
      ]);
    });

    it("should disallow transporter to sign transport when required data is missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: null, // Missing recepisse and not exempted
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
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should disallow transporter to sign transport when bspaoh is not SIGNED_BY_PRODUCER", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.INITIAL,

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
            type: "TRANSPORT",
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
