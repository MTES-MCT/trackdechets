import { BspaohStatus, UserRole, WasteAcceptationStatus } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";

import type { Mutation, MutationSignBspaohArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";

import { gql } from "graphql-tag";
import { fullBspaoh } from "../../../fragments";
import { buildPdfAsBase64 } from "../../../pdf/generator";

jest.mock("../../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

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

  describe("RECEPTION", () => {
    it("should allow destination to sign reception (RECEIVED)", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: null,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.RECEIVED);
      expect(persisted?.destinationReceptionSignatureDate).toBeTruthy();
      expect(persisted?.destinationReceptionSignatureAuthor).toEqual(user.name);
    });

    it("should allow destination to sign reception (RECEIVED) if no weight, but quantity is provided", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionWasteReceivedWeightValue: null,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.RECEIVED);
      expect(persisted?.destinationReceptionSignatureDate).toBeTruthy();
      expect(persisted?.destinationReceptionSignatureAuthor).toEqual(user.name);
    });

    it("should allow destination to sign reception (REFUSED)", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionWasteRefusalReason: "non conforme",
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "REFUSED" },
            { id: "packaging_2", acceptation: "REFUSED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });
      expect(data.signBspaoh.id).toBeTruthy();

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.REFUSED);
      expect(persisted?.destinationReceptionSignatureDate).toBeTruthy();
      expect(persisted?.destinationReceptionSignatureAuthor).toEqual(user.name);
    });

    it.skip("should disallow destination to sign reception if waste info is missing", async () => {
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
          // no waste weight or quantity info provided
          destinationReceptionWasteReceivedWeightValue: null,

          destinationReceptionWasteQuantityValue: null,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le poids du déchet reçu est obligatoire.",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should disallow destination to sign reception if transporter did not sign", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bspaoh = await bspaohFactory({
        opt: {
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          destinationCompanySiret: company.siret,
          destinationReceptionAcceptationStatus:
            WasteAcceptationStatus.ACCEPTED,
          destinationReceptionWasteRefusalReason: "non conforme",
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
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

    it("should disallow destination to sign reception (REFUSED) if refusal reason is missing", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionWasteRefusalReason: null,
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "REFUSED" },
            { id: "packaging_2", acceptation: "REFUSED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "La raison du refus est obligatoire.",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should deny destination to sign reception if all packagins are accepted (PARTIALLY_REFUSED)", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
            WasteAcceptationStatus.PARTIALLY_REFUSED,
          destinationReceptionWasteRefusalReason: "non conforme",
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le bordereau ne peut être partiellement refusé si tous les packagings sont refusés ou acceptés",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should allow destination to sign reception (PARTIALLY_REFUSED)", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
            WasteAcceptationStatus.PARTIALLY_REFUSED,
          destinationReceptionWasteRefusalReason: "non conforme",
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "REFUSED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.PARTIALLY_REFUSED);
      expect(persisted?.destinationReceptionSignatureDate).toBeTruthy();
      expect(persisted?.destinationReceptionSignatureAuthor).toEqual(user.name);
    });

    it("should disallow destination to sign reception if received waste fields are incomplete", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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

          destinationReceptionWasteReceivedWeightValue: null,

          destinationReceptionWasteQuantityValue: null,

          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "ACCEPTED" }
          ],

          handedOverToDestinationSignatureDate: new Date(),
          handedOverToDestinationSignatureAuthor: "Transporter",

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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le champ d'acceptation du déchet est obligatoire.\n" +
            "La date de réception est obligatoire.",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should deny reception signature if all packagings reception info is missing", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          // no packgaing reception info
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le statut d'acceptation de tous les packagings doit être précisé",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.SENT);
    });
    it("should deny reception signature if some packagings reception info is missing", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          // one packaging reception info is missing
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le statut d'acceptation de tous les packagings doit être précisé",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.SENT);
    });
    it("should deny reception signature if all packagings are not accepted", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: { set: ["WASTEPROCESSOR"] },
        wasteProcessorTypes: { set: ["CREMATION"] }
      });
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
          destinationReceptionWasteReceivedWeightValue: 10,

          destinationReceptionWasteQuantityValue: 1,
          destinationReceptionDate: new Date(),
          // one packaging reception info is missing
          destinationReceptionWastePackagingsAcceptation: [
            { id: "packaging_1", acceptation: "ACCEPTED" },
            { id: "packaging_2", acceptation: "REFUSED" }
          ],
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
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le bordereau ne peut être accepté que si tous les packagings sont acceptés",
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);

      const persisted = await prisma.bspaoh.findUnique({
        where: { id: bspaoh.id }
      });

      expect(persisted?.status).toEqual(BspaohStatus.SENT);
    });
  });
});
