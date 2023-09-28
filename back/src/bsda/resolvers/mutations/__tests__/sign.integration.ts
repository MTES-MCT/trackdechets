import { BsdaStatus, UserRole, WasteAcceptationStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  Mutation,
  MutationSignBsdaArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  addTransporterReceipt,
  bsdaFactory
} from "../../../__tests__/factories";
import { buildPdfAsBase64 } from "../../../pdf/generator";

jest.mock("../../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

const SIGN_BSDA = `
mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
  signBsda(id: $id, input: $input) {
      id
      status
      transporter {
        recepisse {
          number
          department
          validityLimit
          isExempted
        }
      }
  }
}
`;

describe("Mutation.Bsda.sign", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(SIGN_BSDA, {
      variables: {
        id: 1,
        input: { type: "EMISSION", author: "The Ghost" }
      }
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

  it("should throw an error if the bsda being signed doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsda">,
      MutationSignBsdaArgs
    >(SIGN_BSDA, {
      variables: {
        id: "123",
        input: {
          author: user.name,
          type: "EMISSION"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau avec l'identifiant \"123\" n'existe pas."
      })
    ]);
  });

  describe("EMISSION", () => {
    it("should allow emitter to sign", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should throw an error if the bsda is missing required data when the emitter tries to sign", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          wasteCode: null // missing field
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: user.name,
            type: "EMISSION"
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

    it("should allow the transporter to sign for the emitter with the security code", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          transporterCompanySiret: transporter.company.siret
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: emitter.user.name,
            type: "EMISSION",
            securityCode: emitter.company.securityCode
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should disallow the transporter to sign for the emitter without the security code", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          transporterCompanySiret: transporter.company.siret
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: emitter.user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should disallow the transporter to sign for the emitter with a wrong security code", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          transporterCompanySiret: transporter.company.siret
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: emitter.user.name,
            type: "EMISSION",
            securityCode: 1
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le code de signature est invalide."
        })
      ]);
    });

    it("should throw an error when the emitter tries to sign twice", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date()
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Cette signature a déjà été apposée."
        })
      ]);
    });

    it("should throw an error if the transporter tries to sign without the emitter's signature", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: null,
          emitterEmissionSignatureAuthor: null,
          transporterCompanySiret: transporter.company.siret
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: transporter.user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });
  });

  describe("WORKER", () => {
    it("should allow worker to sign work", async () => {
      const worker = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await addTransporterReceipt(
        await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            emitterEmissionSignatureAuthor: "Emétteur",
            emitterEmissionSignatureDate: new Date(),
            workerCompanySiret: worker.company.siret
          }
        })
      );

      const { mutate } = makeClient(worker.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "WORK",
            author: worker.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should allow worker to sign work without emitter signature if worker has paper signature", async () => {
      const worker = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await addTransporterReceipt(
        await bsdaFactory({
          opt: {
            status: "INITIAL",
            workerWorkHasEmitterPaperSignature: true,
            workerCompanySiret: worker.company.siret
          }
        })
      );

      const { mutate } = makeClient(worker.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "WORK",
            author: worker.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should disallow worker to sign transport when required data is missing", async () => {
      const worker = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerCompanySiret: worker.company.siret,
          workerCompanyMail: null // Missing worker company name
        }
      });

      const { mutate } = makeClient(worker.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "WORK",
            author: worker.user.name
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
  });

  describe("TRANSPORT", () => {
    it("should allow transporter to sign transport when exempted of receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA-00-XX"]
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should allow transporter to sign transport and auto-complete the receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const receipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA-00-XX"]
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
      expect(data.signBsda.transporter?.recepisse?.department).toBe(
        receipt.department
      );
      expect(data.signBsda.transporter?.recepisse?.number).toBe(
        receipt.receiptNumber
      );
      expect(data.signBsda.transporter?.recepisse?.validityLimit).toBe(
        receipt.validityLimit.toISOString()
      );
    });

    it("should disallow transporter to sign transport when receipt if missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA-00-XX"]
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
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
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseNumber: null // Missing recepisse
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
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

    it("should disallow transporter to sign transport when bsda is not SIGNED_BY_WORKER", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          status: "INITIAL",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Vous ne pouvez pas apposer cette signature sur le bordereau."
        })
      ]);
    });

    it("should allow transporter to sign bsda signed by emitter only if worker is disabled", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await addTransporterReceipt(
        await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            emitterEmissionSignatureAuthor: "Emétteur",
            emitterEmissionSignatureDate: new Date(),
            workerIsDisabled: true,
            workerCompanySiret: null,
            workerCompanyName: null,
            transporterCompanySiret: transporter.company.siret,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: ["AA-00-XX"]
          }
        })
      );

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should allow transporter to sign an initial bsda if the emitter is a private individual and the worker is disabled", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await addTransporterReceipt(
        await bsdaFactory({
          opt: {
            status: "INITIAL",
            emitterIsPrivateIndividual: true,
            emitterCompanySiret: null,
            workerIsDisabled: true,
            workerCompanySiret: null,
            workerCompanyName: null,
            transporterCompanySiret: transporter.company.siret,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: ["AA-00-XX"]
          }
        })
      );

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });
  });

  describe("OPERATION", () => {
    it("should allow destination to sign operation", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "Worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should mark as AWAITING_CHILD if operation code implies it", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "Worker",
          workerWorkSignatureDate: new Date(),
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: company.siret,
          destinationOperationCode: "D 15",
          destinationOperationMode: undefined
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
      expect(data.signBsda.status).toBe(BsdaStatus.AWAITING_CHILD);
    });

    it("should allow destination to sign operation on intial bsda for déchetteries", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          status: "INITIAL",
          type: "COLLECTION_2710",
          destinationCompanySiret: company.siret,
          transporterCompanyName: null,
          transporterCompanySiret: null,
          workerCompanyName: null,
          workerCompanySiret: null
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(data.signBsda.id).toBeTruthy();
    });

    it("should disallow destination to sign operation when required data is missing", async () => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "Worker",
          workerWorkSignatureDate: new Date(),
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          destinationCompanySiret: company.siret,
          destinationOperationCode: null // Missing operation code
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "OPERATION",
            author: user.name
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

    it("should mark all BSDAs in the history as PROCESSED", async () => {
      const { company: emitter } = await userWithCompanyFactory(UserRole.ADMIN);
      const { company: transporter } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter
      });
      const { user, company: destination } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const { company: ttr1 } = await userWithCompanyFactory(UserRole.ADMIN);
      const { company: ttr2 } = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda1 = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: ttr1.siret,
          status: BsdaStatus.AWAITING_CHILD,
          destinationOperationCode: "D 9",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // bsda1 => bsda2
      const bsda2 = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: ttr2.siret,
          destinationOperationCode: "D 9",
          destinationOperationMode: "ELIMINATION",
          status: BsdaStatus.AWAITING_CHILD,
          forwarding: { connect: { id: bsda1.id } }
        }
      });
      // bsda1 => bsda2 => bsda3
      const bsda3 = await bsdaFactory({
        opt: {
          status: BsdaStatus.SENT,
          emitterCompanySiret: ttr2.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: destination.siret,
          destinationOperationCode: "D 9",
          destinationOperationMode: "ELIMINATION",
          forwarding: { connect: { id: bsda2.id } }
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda3.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsda.id).toBeTruthy();

      const newBsda1 = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda1.id }
      });
      expect(newBsda1.status).toEqual(BsdaStatus.PROCESSED);
      const newBsda2 = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda2.id }
      });
      expect(newBsda2.status).toEqual(BsdaStatus.PROCESSED);
    });

    it("should throw an error when the emitter tries to sign a COLLECTION_2710 bsda", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          status: "INITIAL",
          type: "COLLECTION_2710",
          transporterCompanyName: null,
          transporterCompanySiret: null,
          workerCompanyName: null,
          workerCompanySiret: null
        }
      });
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Ce type de bordereau ne peut être signé qu'à la réception par la déchetterie."
        })
      ]);
    });

    it("should throw an error when the worker tries to sign a bsda that has no packaging", async () => {
      const worker = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await addTransporterReceipt(
        await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            emitterEmissionSignatureAuthor: "Emétteur",
            emitterEmissionSignatureDate: new Date(),
            workerCompanySiret: worker.company.siret,
            packagings: []
          }
        })
      );

      const { mutate } = makeClient(worker.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "WORK",
            author: worker.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le conditionnement est obligatoire"
        })
      ]);
    });

    it("should release initial BSDAs when grouping BSDA is refused", async () => {
      const { company: emitter } = await userWithCompanyFactory(UserRole.ADMIN);
      const { company: transporter } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter
      });
      const { user, company: destination } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const { company: ttr1 } = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: ttr1.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: destination.siret,
          status: BsdaStatus.SENT,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionRefusalReason: "Invalid bsda, cant accept",
          destinationReceptionWeight: 0,
          destinationOperationCode: null
        }
      });

      const grouped1 = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: ttr1.siret,
          destinationOperationCode: "R 13",
          status: BsdaStatus.AWAITING_CHILD,
          groupedIn: { connect: { id: bsda.id } }
        }
      });
      const grouped2 = await bsdaFactory({
        opt: {
          status: BsdaStatus.AWAITING_CHILD,
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: ttr1.siret,
          destinationOperationCode: "R 13",
          groupedIn: { connect: { id: bsda.id } }
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsda.id).toBeTruthy();

      const newGrouped1 = await prisma.bsda.findUniqueOrThrow({
        where: { id: grouped1.id }
      });
      expect(newGrouped1.status).toEqual(BsdaStatus.AWAITING_CHILD);
      expect(newGrouped1.groupedInId).toBe(null);

      const newGrouped2 = await prisma.bsda.findUniqueOrThrow({
        where: { id: grouped2.id }
      });
      expect(newGrouped2.status).toEqual(BsdaStatus.AWAITING_CHILD);
      expect(newGrouped2.groupedInId).toBe(null);
    });

    it("should release forwarded BSDA when forwarding BSDA is refused", async () => {
      const { company: emitter } = await userWithCompanyFactory(UserRole.ADMIN);
      const { company: transporter } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter
      });
      const { user, company: destination } = await userWithCompanyFactory(
        UserRole.ADMIN
      );
      const { company: ttr1 } = await userWithCompanyFactory(UserRole.ADMIN);

      const forwarded = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: ttr1.siret,
          status: BsdaStatus.AWAITING_CHILD,
          destinationOperationCode: "R 13"
        }
      });

      const forwarding = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
          destinationCompanySiret: destination.siret,
          destinationReceptionWeight: 0,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionRefusalReason: "Invalid bsda, cant accept",
          destinationOperationCode: null,
          status: BsdaStatus.SENT,
          forwarding: { connect: { id: forwarded.id } }
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: forwarding.id,
          input: {
            type: "OPERATION",
            author: user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsda.id).toBeTruthy();

      const newForwarding = await prisma.bsda.findUniqueOrThrow({
        where: { id: forwarding.id }
      });
      expect(newForwarding.status).toEqual(BsdaStatus.REFUSED);
      expect(newForwarding.forwardingId).toBe(null);
    });
  });
});
