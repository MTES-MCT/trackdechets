import {
  BsdaStatus,
  Prisma,
  TransportMode,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import type {
  BsdaInput,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  ecoOrganismeFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../../__tests__/factories";
import { buildPdfAsBase64 } from "../../../pdf/generator";
import { getTransportersSync } from "../../../database";
import { operationHooksQueue } from "../../../../queue/producers/operationHook";
import { AllBsdaSignatureType } from "../../../types";
import gql from "graphql-tag";

jest.mock("../../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

export const UPDATE_BSDA = gql`
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      id
      emitter {
        company {
          name
        }
      }
      waste {
        code
      }
      transporter {
        company {
          name
          siret
        }
        recepisse {
          isExempted
          number
          department
          validityLimit
        }
        transport {
          mode
        }
      }
      destination {
        company {
          name
        }
      }
      intermediaries {
        siret
      }
    }
  }
`;

const SIGN_BSDA = gql`
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
      destination {
        reception {
          signature {
            date
            author
          }
        }
      }
      waste {
        isSubjectToADR
        adr
      }
    }
  }
`;

describe("Mutation.Bsda.sign", () => {
  afterAll(resetDatabase);

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

    it("should throw error if the destination (exutoire) is not completed", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: null,
          destinationCompanyName: null,
          destinationCompanyAddress: null,
          destinationCompanyContact: null,
          destinationCompanyPhone: null,
          destinationCompanyMail: null,
          destinationCap: null,
          destinationPlannedOperationCode: null
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
            "Le nom de l'entreprise de destination est obligatoire.\n" +
            "Le SIRET de l'entreprise de destination est obligatoire.\n" +
            "L'adresse de l'entreprise de destination est obligatoire.\n" +
            "Le nom de contact de l'entreprise de destination est obligatoire.\n" +
            "Le téléphone de l'entreprise de destination est obligatoire.\n" +
            "L'email de l'entreprise de destination est obligatoire.\n" +
            "Le CAP du destinataire est obligatoire.\n" +
            "Le code d'opération prévu est obligatoire."
        })
      ]);

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
          emitterCompanySiret: emitter.company.siret
        },
        transporterOpt: {
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
          emitterCompanySiret: emitter.company.siret
        },
        transporterOpt: {
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
          emitterCompanySiret: emitter.company.siret
        },
        transporterOpt: {
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
          emitterEmissionSignatureAuthor: null
        },
        transporterOpt: {
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
      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerCompanySiret: worker.company.siret,
          // vérifie que les numéros de scellés ne sont pas obligatoires
          // > selon l'exutoire, le numéro est obligatoire ou pas (ISDD oui, ISDND non)
          // > et comme on ne sait pas si il va dans l'un ou l'autre, du moins auj.
          // > on ne peut pas le rendre obligatoire"
          wasteSealNumbers: []
        }
      });

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
      const bsda = await bsdaFactory({
        opt: {
          status: "INITIAL",
          workerWorkHasEmitterPaperSignature: true,
          workerCompanySiret: worker.company.siret
        }
      });

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
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
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
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
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

    it("should forbid invalid plates", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      await transporterReceiptFactory({
        company: transporter.company
      });

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA"]
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
            "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          )
        })
      ]);
    });

    it("should allow invalid plates on bsda create before V2025020", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      await transporterReceiptFactory({
        company: transporter.company
      });

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date(),
          createdAt: new Date("2025-01-04T00:00:00.000Z") // created before V2025020
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA"]
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
      expect(errors).toBeUndefined();
    });

    it("should disallow transporter to sign transport when recepisse is missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_WORKER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerWorkSignatureAuthor: "worker",
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: ["AA-00-XX"],
          transporterRecepisseNumber: null
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
            "Le numéro de récépissé du transporteur n° 1 est obligatoire. " +
              "L'établissement doit renseigner son récépissé dans Trackdéchets"
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
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
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
          workerWorkSignatureDate: new Date()
        },
        transporterOpt: {
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
          message: "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
        })
      ]);
    });

    it("should allow transporter to sign bsda signed by emitter only if worker is disabled", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerIsDisabled: true,
          workerCompanySiret: null,
          workerCompanyName: null
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
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

    it("should allow transporter to sign an initial bsda if the emitter is a private individual and the worker is disabled", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });
      const bsda = await bsdaFactory({
        opt: {
          status: "INITIAL",
          emitterIsPrivateIndividual: true,
          emitterCompanySiret: null,
          workerIsDisabled: true,
          workerCompanySiret: null,
          workerCompanyName: null
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
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

    it(
      "should sign transport for transporter N and auto-complete recepisse" +
        "with info from company N (correction bug tra-14706)",
      async () => {
        const emitter = await userWithCompanyFactory("ADMIN");
        const transporter1 = await userWithCompanyFactory("ADMIN");
        const transporter2 = await userWithCompanyFactory("ADMIN");
        await transporterReceiptFactory({
          company: transporter1.company,
          number: "rec-1"
        });
        await transporterReceiptFactory({
          company: transporter2.company,
          number: "rec-2"
        });

        // Crée un BSDA avec la signature du premier transporteur
        const bsda = await bsdaFactory({
          opt: {
            status: "SENT",
            emitterCompanySiret: emitter.company.siret,
            emitterCompanyName: emitter.company.name,
            emitterEmissionSignatureDate: new Date("2018-12-11T00:00:00.000Z")
          },
          transporterOpt: {
            transporterCompanySiret: transporter1.company.siret,
            transporterTransportSignatureDate: new Date(
              "2018-12-12T00:00:00.000Z"
            )
          }
        });

        // Ajoute un second transporteur qui n'a pas encore signé
        const bsdaTransporter2 = await bsdaTransporterFactory({
          bsdaId: bsda.id,
          opts: {
            transporterCompanySiret: transporter2.company.siret,
            transporterTransportSignatureDate: null
          }
        });

        const transporterTransportSignatureDate2 = new Date(
          "2018-12-13T00:00:00.000Z"
        );
        const { mutate } = makeClient(transporter2.user);
        const { errors } = await mutate<
          Pick<Mutation, "signBsda">,
          MutationSignBsdaArgs
        >(SIGN_BSDA, {
          variables: {
            id: bsda.id,
            input: {
              type: "TRANSPORT",
              date: transporterTransportSignatureDate2.toISOString() as any,
              author: "Transporteur n°2"
            }
          }
        });

        expect(errors).toBeUndefined();

        const updatedBsda = await prisma.bsda.findFirstOrThrow({
          where: { id: bsda.id },
          include: { transporters: true }
        });

        // Le statut ne doit pas être modifié
        expect(updatedBsda.status).toEqual("SENT");

        const transporters = getTransportersSync(updatedBsda);

        expect(transporters[1].id).toEqual(bsdaTransporter2.id);
        expect(transporters[1].transporterTransportSignatureDate).toEqual(
          transporterTransportSignatureDate2
        );

        expect(transporters[1].transporterRecepisseNumber).toEqual("rec-2");
      }
    );

    it("should not be possible for transporter N+1 to sign if transporter N has not signed", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporter1.company });
      await transporterReceiptFactory({ company: transporter2.company });

      // Crée un BSDA avec un transporteur qui n'a pas encore signé
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitter.company.siret,
          emitterCompanyName: emitter.company.name,
          emitterEmissionSignatureDate: new Date("2018-12-11T00:00:00.000Z")
        },
        transporterOpt: {
          transporterCompanySiret: transporter1.company.siret,
          transporterTransportSignatureDate: null
        }
      });

      // Ajoute un second transporteur qui n'a pas encore signé
      await bsdaTransporterFactory({
        bsdaId: bsda.id,
        opts: {
          transporterCompanySiret: transporter2.company.siret,
          transporterTransportSignatureDate: null
        }
      });

      const { mutate } = makeClient(transporter2.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "TRANSPORT",
            author: "Transporteur n°2"
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous ne pouvez pas signer ce bordereau"
        })
      ]);
    });

    // Transport mode is now required at transporter signature step
    describe("transporterTransportMode", () => {
      const prepareBsdaAndSignTransport = async (
        transporterOpt,
        updateOpt?
      ) => {
        // Create BSDA
        const transporter = await userWithCompanyFactory(UserRole.ADMIN);
        await transporterReceiptFactory({
          company: transporter.company
        });

        const bsda = await bsdaFactory({
          opt: {
            status: "SIGNED_BY_WORKER",
            emitterEmissionSignatureAuthor: "Emétteur",
            emitterEmissionSignatureDate: new Date(),
            workerWorkSignatureAuthor: "worker",
            workerWorkSignatureDate: new Date()
          },
          transporterOpt: {
            transporterCompanySiret: transporter.company.siret,
            transporterRecepisseIsExempted: true,
            transporterTransportMode: null,
            transporterTransportPlates: ["AA-00-XX"],
            ...transporterOpt
          }
        });

        // Update?
        const { mutate } = makeClient(transporter.user);
        if (updateOpt) {
          await mutate<Pick<Mutation, "updateBsda">, MutationUpdateBsdaArgs>(
            UPDATE_BSDA,
            {
              variables: {
                id: bsda.id,
                input: {
                  ...updateOpt
                }
              }
            }
          );
        }

        // Sign transport
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

        const updatedBsda = await prisma.bsda.findFirst({
          where: { id: bsda.id },
          include: { transporters: true }
        });

        return { errors, bsda: updatedBsda };
      };

      it("should throw error if transport mode is not defined", async () => {
        // When
        const { errors } = await prepareBsdaAndSignTransport({});

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Le mode de transport n° 1 est obligatoire."
        );
      });

      it("should work if transport mode is in initial BSD", async () => {
        // When
        const { errors, bsda } = await prepareBsdaAndSignTransport({
          transporterTransportMode: TransportMode.ROAD
        });

        // Then
        expect(errors).toBeUndefined();
        expect(bsda?.transporters[0].transporterTransportMode).toBe(
          TransportMode.ROAD
        );
      });

      it("should work if transport mode is given before transporter signature", async () => {
        // When
        const { errors, bsda } = await prepareBsdaAndSignTransport(
          {},
          {
            transporter: {
              transport: {
                mode: TransportMode.ROAD
              }
            }
          }
        );

        // Then
        expect(errors).toBeUndefined();
        expect(bsda?.transporters[0].transporterTransportMode).toBe(
          TransportMode.ROAD
        );
      });

      it("should throw error if transport mode is unset before signature", async () => {
        // When
        const { errors } = await prepareBsdaAndSignTransport(
          {
            transporterTransportMode: TransportMode.AIR
          },
          {
            transporter: {
              transport: {
                mode: null
              }
            }
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Le mode de transport n° 1 est obligatoire."
        );
      });
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
          destinationCompanySiret: company.siret,
          destinationOperationCode: "R 5",
          destinationOperationMode: "RECYCLAGE"
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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

      await new Promise(resolve => {
        operationHooksQueue.once("global:drained", () => resolve(true));
      });

      const signedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: { finalOperations: true }
      });

      // final operation should be set
      expect(signedBsda.finalOperations).toHaveLength(1);
    });

    it.each([
      WasteAcceptationStatus.ACCEPTED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ])(
      "should forbid operation signature when weight is 0 ans status is %p",
      async destinationReceptionAcceptationStatus => {
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
            destinationCompanySiret: company.siret,
            destinationOperationCode: "R 5",
            destinationOperationMode: "RECYCLAGE",
            destinationReceptionWeight: 0,
            destinationReceptionAcceptationStatus
          },
          transporterOpt: {
            transporterCompanySiret: transporter.company.siret,
            transporterTransportSignatureAuthor: "Transporter",
            transporterTransportSignatureDate: new Date(),
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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
            message: "Le poids du déchet reçu doit être renseigné et non nul."
          })
        ]);

        const updateBsda = await prisma.bsda.findUniqueOrThrow({
          where: { id: bsda.id }
        });

        expect(updateBsda.status).toBe("SENT");
      }
    );

    it("should forbid operation signature when weight is 0 ans status is %p", async () => {
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
          destinationCompanySiret: company.siret,
          destinationOperationCode: "R 5",
          destinationOperationMode: "RECYCLAGE",
          destinationReceptionWeight: 0,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionRefusalReason: "non conforme"
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      const { mutate } = makeClient(user);
      const { errors, data } = await mutate<
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

      expect(errors).toEqual(undefined);

      expect(data.signBsda.id).toBeTruthy();
      expect(data.signBsda.status).toBe(BsdaStatus.REFUSED);

      const updateBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id }
      });

      expect(updateBsda.status).toBe("REFUSED");
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
          destinationCompanySiret: company.siret,
          destinationOperationCode: "D 15",
          destinationOperationMode: undefined
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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
          workerCompanyName: null,
          workerCompanySiret: null,
          // permet de vérifier que les numéros de scellés ne sont pas
          //  obligatoires dans le cadre d'un BSDA de collecte en déchetterie
          wasteSealNumbers: []
        },
        transporterOpt: {
          transporterCompanyName: null,
          transporterCompanySiret: null
        }
      });

      // il n'y a pas de transporteur sur les bordereaux de collecte
      // en déchetterie
      await prisma.bsda.update({
        where: { id: bsda.id },
        data: { transporters: { deleteMany: {} } }
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

    it("destination should be able to sign reception + operation for COLLECTION_2710", async () => {
      // Given
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          status: "INITIAL",
          type: "COLLECTION_2710",
          destinationCompanySiret: company.siret,
          workerCompanyName: null,
          workerCompanySiret: null
        },
        transporterOpt: {
          transporterCompanyName: null,
          transporterCompanySiret: null
        }
      });

      // il n'y a pas de transporteur sur les bordereaux de collecte
      // en déchetterie
      await prisma.bsda.update({
        where: { id: bsda.id },
        data: { transporters: { deleteMany: {} } }
      });

      // When: sign reception
      const { mutate } = makeClient(user);
      const { errors: receptionErrors, data: receptionData } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            type: "RECEPTION",
            author: user.name
          }
        }
      });

      // Then
      expect(receptionErrors).toBeUndefined();
      expect(receptionData.signBsda.status).toBe("RECEIVED");

      // When: sign operation
      const { errors: operationErrors, data: operationData } = await mutate<
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

      // Then
      expect(operationErrors).toBeUndefined();
      expect(operationData.signBsda.status).toBe("PROCESSED");
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
          destinationCompanySiret: company.siret,
          destinationOperationCode: null // Missing operation code
        },
        transporterOpt: {
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date()
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
          destinationCompanySiret: ttr1.siret,
          status: BsdaStatus.AWAITING_CHILD,
          destinationOperationCode: "D 5",
          destinationOperationMode: "ELIMINATION"
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      // bsda1 => bsda2
      const bsda2 = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: ttr2.siret,
          destinationOperationCode: "D 5",
          destinationOperationMode: "ELIMINATION",
          status: BsdaStatus.AWAITING_CHILD,
          forwarding: { connect: { id: bsda1.id } }
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });
      // bsda1 => bsda2 => bsda3
      const bsda3 = await bsdaFactory({
        opt: {
          status: BsdaStatus.SENT,
          emitterCompanySiret: ttr2.siret,
          destinationCompanySiret: destination.siret,
          destinationOperationCode: "D 5",
          destinationOperationMode: "ELIMINATION",
          forwarding: { connect: { id: bsda2.id } }
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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
          workerCompanyName: null,
          workerCompanySiret: null
        },
        transporterOpt: {
          transporterCompanyName: null,
          transporterCompanySiret: null
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
      const bsda = await bsdaFactory({
        opt: {
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emétteur",
          emitterEmissionSignatureDate: new Date(),
          workerCompanySiret: worker.company.siret,
          packagings: []
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
          message: "Le conditionnement est obligatoire."
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
          destinationCompanySiret: destination.siret,
          status: BsdaStatus.SENT,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionRefusalReason: "Invalid bsda, cant accept",
          destinationReceptionWeight: 0,
          destinationOperationCode: null
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      const grouped1 = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: ttr1.siret,
          destinationOperationCode: "R 13",
          status: BsdaStatus.AWAITING_CHILD,
          groupedIn: { connect: { id: bsda.id } }
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });
      const grouped2 = await bsdaFactory({
        opt: {
          status: BsdaStatus.AWAITING_CHILD,
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: ttr1.siret,
          destinationOperationCode: "R 13",
          groupedIn: { connect: { id: bsda.id } }
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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
          destinationCompanySiret: ttr1.siret,
          status: BsdaStatus.AWAITING_CHILD,
          destinationOperationCode: "R 13"
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      const forwarding = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: destination.siret,
          destinationReceptionWeight: 0,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          destinationReceptionRefusalReason: "Invalid bsda, cant accept",
          destinationOperationCode: null,
          status: BsdaStatus.SENT,
          forwarding: { connect: { id: forwarded.id } }
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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

    it("should be possible to sign operation even if the last transporter multi-modal has not signed", async () => {
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
          destinationCompanySiret: company.siret
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterRecepisseNumber: transporterReceipt.receiptNumber,
          transporterRecepisseDepartment: transporterReceipt.department,
          transporterRecepisseValidityLimit: transporterReceipt.validityLimit
        }
      });

      // Crée un second transporteur qui n'a pas encore signé
      await bsdaTransporterFactory({
        bsdaId: bsda.id,
        opts: {
          transporterTransportSignatureDate: null,
          // On enlève la plaque immat pour vérifier que les règles de validation
          // ne sont pas appliqués pour les transporteurs N > 1
          transporterTransportPlates: []
        }
      });

      const { mutate } = makeClient(user);

      // Finalement le déchet va directement au centre de traitement
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

      const updatedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: { transporters: true }
      });

      expect(updatedBsda.status).toEqual("PROCESSED");

      // le second transporteur qui n'a pas signé ne doit plus apparaitre sur le bordereau
      expect(updatedBsda.transporters).toHaveLength(1);
      expect(updatedBsda.transporters[0].transporterCompanySiret).toEqual(
        transporter.company.siret
      );
      expect(
        updatedBsda.transporters[0].transporterTransportSignatureDate
      ).toBeDefined();
    });
  });

  describe("closed sirets", () => {
    // eslint-disable-next-line prefer-const
    let searchCompanyMock = jest.fn().mockReturnValue({});
    let makeClientLocal: typeof makeClient;

    beforeAll(async () => {
      // Mock les appels à la base SIRENE
      jest.mock("../../../../companies/search", () => ({
        // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
        ...jest.requireActual("../../../../companies/search"),
        searchCompany: searchCompanyMock
      }));

      // Ré-importe makeClient pour que searchCompany soit bien mocké
      jest.resetModules();
      makeClientLocal = require("../../../../__tests__/testClient")
        .default as typeof makeClient;
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await resetDatabase();
    });

    const createUserAndBsda = async (
      input: Partial<Prisma.BsdaCreateInput> = {}
    ) => {
      const emitterCompanyAndUser = await userWithCompanyFactory("MEMBER", {
        name: "Emitter"
      });
      const user = emitterCompanyAndUser.user;
      const emitter = emitterCompanyAndUser.company;
      const destination = await companyFactory({ name: "Destination" });
      const nextDestination = await companyFactory({ name: "Destination" });
      const transporter = await companyFactory({ name: "Transporter" });
      const { user: workerUser, company: worker } =
        await userWithCompanyFactory("MEMBER", { name: "Worker" });
      const broker = await companyFactory({
        name: "Broker",
        companyTypes: ["BROKER"],
        brokerReceipt: {
          create: {
            receiptNumber: "recepisse",
            department: "07",
            validityLimit: new Date()
          }
        }
      });
      const intermediary = await companyFactory({ name: "Intermediary" });
      const ecoOrganisme = await ecoOrganismeFactory({
        handle: { handleBsda: true },
        createAssociatedCompany: true
      });

      const bsda = await bsdaFactory({
        opt: {
          status: BsdaStatus.INITIAL,
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: destination.siret,
          destinationOperationNextDestinationCompanySiret:
            nextDestination.siret,
          destinationOperationNextDestinationCompanyName: nextDestination.name,
          destinationOperationNextDestinationCompanyAddress:
            "Next destination address",
          destinationOperationNextDestinationCompanyContact:
            "Next destination contact",
          destinationOperationNextDestinationCompanyPhone: "060102030405",
          destinationOperationNextDestinationCompanyMail:
            "next.destination@mail.com",
          destinationOperationNextDestinationCap: "Next destination CAP",
          destinationOperationNextDestinationPlannedOperationCode: "R5",
          workerCompanySiret: worker.siret,
          brokerCompanySiret: broker.siret,
          transporters: {
            createMany: {
              data: [
                {
                  number: 1,
                  transporterCompanySiret: transporter.siret,
                  transporterCompanyName: transporter.name
                }
              ]
            }
          },
          intermediaries: {
            create: [
              {
                siret: intermediary.siret!,
                name: intermediary.name,
                address: "intermediary address",
                contact: "intermediary"
              }
            ]
          },
          ecoOrganismeSiret: ecoOrganisme.siret,
          ...input
        }
      });

      return { user, workerUser, bsda };
    };

    it("should not be able to sign if a siret is closed", async () => {
      // In this example the emitter is closed, so he shouldn't
      // be able to sign the EMISSION step

      // Given
      const { user, bsda } = await createUserAndBsda();

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: siret === bsda.emitterCompanySiret ? "F" : "O",
          address: "Company address",
          name: "Company name"
        };
      });

      // When
      const { mutate } = makeClientLocal(user);
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

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'établissement ${bsda.emitterCompanySiret} est fermé selon le répertoire SIRENE`
      );
    });

    it("should be able to sign if a siret is closed but field is sealed", async () => {
      // In this example the emitter has closed but it's ok because
      // EMISSION has already been signed. The worker can go on with
      // the workflow

      // Given
      const { workerUser, bsda } = await createUserAndBsda({
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Emitter",
        status: "SIGNED_BY_PRODUCER"
      });

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: siret === bsda.emitterCompanySiret ? "F" : "O",
          address: "Company address",
          name: "Company name"
        };
      });

      // When
      const { mutate } = makeClientLocal(workerUser);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: workerUser.name,
            type: "WORK"
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
    });

    it("should not be able to sign if a siret is dormant", async () => {
      // In this example the emitter is dormant, so he shouldn't
      // be able to sign the EMISSION step

      // Given
      const { user, bsda } = await createUserAndBsda();

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: "O",
          address: "Company address",
          name: "Company name"
        };
      });

      await prisma.company.update({
        where: { siret: bsda.emitterCompanySiret! },
        data: { isDormantSince: new Date() }
      });

      // When
      const { mutate } = makeClientLocal(user);
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

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'établissement avec le SIRET ${bsda.emitterCompanySiret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
      );
    });

    it("should be able to sign if a siret is dormant but field is sealed", async () => {
      // In this example the emitter has gone dormant but it's ok because
      // EMISSION has already been signed. The worker can go on with
      // the workflow

      // Given
      const { workerUser, bsda } = await createUserAndBsda({
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Emitter",
        status: "SIGNED_BY_PRODUCER"
      });

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: "O",
          address: "Company address",
          name: "Company name"
        };
      });

      await prisma.company.update({
        where: { siret: bsda.emitterCompanySiret! },
        data: { isDormantSince: new Date() }
      });

      // When
      const { mutate } = makeClientLocal(workerUser);
      const { errors } = await mutate<
        Pick<Mutation, "signBsda">,
        MutationSignBsdaArgs
      >(SIGN_BSDA, {
        variables: {
          id: bsda.id,
          input: {
            author: workerUser.name,
            type: "WORK"
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
    });
  });

  // New signature step "RECEPTION".
  // As it is a non-breaking change, it is optional and can be skipped.
  describe("RECEPTION", () => {
    const SIGNATURE_DATE = new Date().toISOString();

    let emitterUser;
    let emitterCompany;
    let destinationUser;
    let destinationCompany;
    let transporterCompany;

    beforeAll(async () => {
      await resetDatabase();

      // Emitter
      const emitter = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["PRODUCER"]
      });
      emitterUser = emitter.user;
      emitterCompany = emitter.company;

      // Destination
      const destination = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["WASTE_VEHICLES"],
        wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
      });
      destinationUser = destination.user;
      destinationCompany = destination.company;

      // Transporter
      const transporter = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });
      transporterCompany = transporter.company;
    });

    afterAll(resetDatabase);

    const createBsda = async (opt: Partial<Prisma.BsdaCreateInput> = {}) => {
      return await bsdaFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          // Reception
          destinationReceptionAcceptationStatus: null,
          destinationReceptionWeight: null,
          destinationReceptionDate: null,
          destinationReceptionSignatureDate: null,
          destinationReceptionSignatureAuthor: null,
          // Operation
          destinationOperationCode: null,
          destinationOperationMode: null,
          destinationOperationDate: null,
          ...opt
        },
        transporterOpt: {
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          transporterCompanySiret: transporterCompany.siret
        }
      });
    };

    const signBsda = async (
      user: User,
      bsdaId: string,
      signatureType: AllBsdaSignatureType
    ) => {
      const { mutate } = makeClient(user);
      return mutate<Pick<Mutation, "signBsda">>(SIGN_BSDA, {
        variables: {
          id: bsdaId,
          input: {
            type: signatureType,
            author: user.name,
            date: SIGNATURE_DATE
          }
        }
      });
    };

    const updateBsda = async (user: User, bsdaId: string, input: BsdaInput) => {
      const { mutate } = makeClient(user);
      return mutate<Pick<Mutation, "updateBsda">>(UPDATE_BSDA, {
        variables: {
          id: bsdaId,
          input
        }
      });
    };

    it("should be able to sign reception after transport", async () => {
      // Given
      const bsda = await createBsda();

      // When

      // Step 1: update with required reception data
      const { errors: updateErrors } = await updateBsda(
        destinationUser,
        bsda.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "ACCEPTED",
              weight: 20,
              date: new Date().toISOString() as any
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign reception
      const { errors, data } = await signBsda(
        destinationUser,
        bsda.id,
        "RECEPTION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsda.destination?.reception?.signature?.author).toBe(
        destinationUser.name
      );
      expect(data.signBsda.destination?.reception?.signature?.date).toBe(
        SIGNATURE_DATE
      );
      expect(data.signBsda.status).toBe("RECEIVED");
    });

    it("should return error if trying to sign RECEPTION and reception params are not filled", async () => {
      // Given
      const bsda = await createBsda();

      // When
      const { errors } = await signBsda(destinationUser, bsda.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La date de réception est obligatoire.\n" +
          "Le poids du déchet est obligatoire.\n" +
          "L'acceptation du déchet est obligatoire."
      );
    });

    it("should be able to sign operation after transport, skipping reception", async () => {
      // Given
      const bsda = await createBsda();

      // When

      // Step 1: update with required reception data & operation data
      const { errors: updateErrors } = await updateBsda(
        destinationUser,
        bsda.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "ACCEPTED",
              weight: 20
              // date: null, // Not required!
            },
            operation: {
              code: "R 5",
              date: new Date().toISOString() as any,
              mode: "REUTILISATION"
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign operation
      const { errors, data } = await signBsda(
        destinationUser,
        bsda.id,
        "OPERATION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsda.destination?.reception?.signature?.author).toBe(
        undefined
      );
      expect(data.signBsda.destination?.reception?.signature?.date).toBe(
        undefined
      );
      expect(data.signBsda.status).toBe("PROCESSED");
    });

    it("should not be able to sign operation after transport, skipping reception, if missing reception params", async () => {
      // Given
      const bsda = await createBsda({
        // Missing reception data!
        destinationReceptionAcceptationStatus: null, // Missing param
        destinationReceptionWeight: null, // Missing param
        destinationReceptionDate: null, // Not required!
        // Operation data
        destinationOperationCode: "R 5",
        destinationOperationDate: new Date(),
        destinationOperationMode: "REUTILISATION"
      });

      // When
      const { errors } = await signBsda(destinationUser, bsda.id, "OPERATION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le poids du déchet est obligatoire.\n" +
          "L'acceptation du déchet est obligatoire."
      );
    });

    it("should fail if BSDA has already been received", async () => {
      // Given
      const bsda = await createBsda({
        status: "RECEIVED",
        // Reception data
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionWeight: 20,
        destinationReceptionDate: new Date(),
        destinationReceptionSignatureAuthor: destinationUser.name,
        destinationReceptionSignatureDate: new Date()
      });

      // When
      const { errors } = await signBsda(destinationUser, bsda.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette signature a déjà été apposée.");
    });

    it("should fail if BSDA has already been processed", async () => {
      // Given
      const bsda = await createBsda({
        status: "PROCESSED",
        // Reception data
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionWeight: 20,
        destinationReceptionDate: new Date(),
        // Operation data
        destinationOperationCode: "R 5",
        destinationOperationDate: new Date(),
        destinationOperationMode: "REUTILISATION"
      });

      // When
      const { errors } = await signBsda(destinationUser, bsda.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      );
    });

    it("should fail if BSDA hasn't been sent yet", async () => {
      // Given
      const bsda = await createBsda({
        status: "INITIAL",
        emitterCompanySiret: emitterCompany.siret,
        destinationCompanySiret: destinationCompany.siret,
        // Reception data
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionWeight: 20,
        destinationReceptionDate: new Date()
      });

      // When
      const { errors } = await signBsda(destinationUser, bsda.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      );
    });

    it("should return an error if not signed by destination", async () => {
      // Given
      const bsda = await createBsda();

      // When
      const { errors } = await signBsda(emitterUser, bsda.id, "RECEPTION"); // Signed by emitter!

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous ne pouvez pas signer ce bordereau");
    });

    it("can NOT override reception data once reception has been signed", async () => {
      // Given
      const bsda = await createBsda({
        status: "RECEIVED", // Reception is signed!
        // Reception data
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionWeight: 20,
        destinationReceptionDate: null, // Not required!
        destinationReceptionSignatureAuthor: destinationUser.name,
        destinationReceptionSignatureDate: new Date()
      });

      // When: try to update reception data, but it's too late!
      // Reception has been signed already!
      const { errors } = await updateBsda(destinationUser, bsda.id, {
        destination: {
          reception: {
            acceptationStatus: "PARTIALLY_REFUSED",
            refusalReason: "Not enough weight",
            weight: 20,
            date: new Date().toISOString() as any
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " La date de réception a été verrouillé via signature et ne peut pas être modifié., " +
          "Le poids du déchet a été verrouillé via signature et ne peut pas être modifié., " +
          "L'acceptation du déchet a été verrouillé via signature et ne peut pas être modifié., " +
          "La raison du refus du déchet a été verrouillé via signature et ne peut pas être modifié."
      );
    });
  });

  describe("Mention ADR", () => {
    it.each([undefined, null, ""])(
      "if waste is subject to ADR, wasteAdr cannot be %p",
      async wasteAdr => {
        // Given
        const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
        const bsda = await bsdaFactory({
          opt: {
            emitterCompanySiret: company.siret,
            wasteIsSubjectToADR: true,
            wasteAdr
          }
        });

        // When
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

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Le déchet est soumis à l'ADR. Vous devez préciser la mention correspondante."
        );
      }
    );

    it.each([undefined, null, ""])(
      "if waste is not subject to ADR, wasteAdr can be %p",
      async wasteAdr => {
        // Given
        const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
        const bsda = await bsdaFactory({
          opt: {
            emitterCompanySiret: company.siret,
            wasteIsSubjectToADR: false,
            wasteAdr
          }
        });

        // When
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

        // Then
        expect(errors).toBeUndefined();
      }
    );

    it("should not be allowed to provide wasteAdr for wastes not subject to ADR", async () => {
      // Given
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          wasteIsSubjectToADR: false,
          wasteAdr: "Some ADR mention"
        }
      });

      // When
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

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le déchet n'est pas soumis à l'ADR. Vous ne pouvez pas préciser de mention ADR."
      );
    });

    it("waste subject to ADR + wasteAdr", async () => {
      // Given
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret,
          wasteIsSubjectToADR: true,
          wasteAdr: "Some ADR mention"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors, data } = await mutate<
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

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsda?.waste?.isSubjectToADR).toBeTruthy();
      expect(data.signBsda?.waste?.adr).toBe("Some ADR mention");
    });

    it.each([null, "ADR"])(
      "wasteIsSubjectToADR is optional, wasteAdr can be %p",
      async wasteAdr => {
        // Given
        const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
        const bsda = await bsdaFactory({
          opt: {
            emitterCompanySiret: company.siret,
            wasteIsSubjectToADR: null,
            wasteAdr
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors, data } = await mutate<
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

        // Then
        expect(errors).toBeUndefined();
        expect(data.signBsda?.waste?.isSubjectToADR).toBeNull();
        expect(data.signBsda?.waste?.adr).toBe(wasteAdr);
      }
    );
  });
});
