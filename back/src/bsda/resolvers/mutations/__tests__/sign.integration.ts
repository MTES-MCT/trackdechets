import {
  BsdaStatus,
  Company,
  EcoOrganisme,
  TransportMode,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs
} from "../../../../generated/graphql/types";
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
import bsda from "../../queries/bsda";

jest.mock("../../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

export const UPDATE_BSDA = `
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

    it("should sign transport for transporter N", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporter1.company });
      await transporterReceiptFactory({ company: transporter2.company });

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
    });

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

  describe.only("closed sirets", () => {
    let emitterUser: User;
    let emitter: Company;
    let destinationUser: User;
    let destination: Company;
    let transporter: Company;
    let transporterUser: User;
    let workerUser: User;
    let worker: Company;
    let broker: Company;
    let intermediary: Company;
    let ecoOrganisme: EcoOrganisme;
    let bsda: Awaited<ReturnType<typeof bsdaFactory>>;

    // eslint-disable-next-line prefer-const
    let searchCompanyMock = jest.fn().mockReturnValue({});
    let makeClientLocal: typeof makeClient;

    const createTestData = async () => {
      const emitterCompanyAndUser = await userWithCompanyFactory("ADMIN", {
        companyTypes: ["PRODUCER"]
      });
      emitterUser = emitterCompanyAndUser.user;
      emitter = emitterCompanyAndUser.company;

      const workerCompanyAndUser = await userWithCompanyFactory("ADMIN", {
        companyTypes: ["WORKER"]
      });
      workerUser = workerCompanyAndUser.user;
      worker = workerCompanyAndUser.company;

      const transporterCompanyAndUser = await userWithCompanyFactory("ADMIN", {
        companyTypes: ["TRANSPORTER"]
      });
      transporterUser = transporterCompanyAndUser.user;
      transporter = transporterCompanyAndUser.company;
      await transporterReceiptFactory({ company: transporter });

      const destinationCompanyAndUser = await userWithCompanyFactory("ADMIN", {
        companyTypes: ["WASTEPROCESSOR"]
      });
      destinationUser = destinationCompanyAndUser.user;
      destination = destinationCompanyAndUser.company;

      broker = await companyFactory({ companyTypes: ["BROKER"] });
      intermediary = await companyFactory();
      ecoOrganisme = await ecoOrganismeFactory({
        handle: { handleBsda: true },
        createAssociatedCompany: true
      });

      bsda = await bsdaFactory({
        opt: {
          status: BsdaStatus.INITIAL,
          emitterCompanySiret: emitter.siret,
          emitterEmissionSignatureAuthor: null,
          emitterEmissionSignatureDate: null,
          destinationCompanySiret: destination.siret,
          workerCompanySiret: worker.siret,
          workerWorkSignatureAuthor: null,
          workerWorkSignatureDate: null,
          brokerCompanySiret: broker.siret,
          transporters: {
            createMany: {
              data: [
                {
                  number: 1,
                  transporterCompanySiret: transporter.siret,
                  transporterCompanyName: transporter.name,
                  transporterCompanyAddress: "Transporter address",
                  transporterCompanyContact: "Transporter",
                  transporterCompanyMail: "transporter@mail.com",
                  transporterCompanyPhone: "060102030405",
                  transporterRecepisseDepartment: "75",
                  transporterRecepisseNumber: "RECEIPT-NBR",
                  transporterRecepisseValidityLimit: new Date(),
                  transporterTransportMode: "ROAD",
                  transporterTransportPlates: ["PLATES"]
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
          ecoOrganismeName: ecoOrganisme.name
        },
        transporterOpt: {
          transporterCompanySiret: transporter.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date()
        }
      });

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
    };

    afterAll(resetDatabase);

    const testSigningBsda = async (type, user) => {
      // Given

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
            type
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
    };

    describe("closed sirets", () => {
      beforeAll(async () => {
        await createTestData();

        // All companies are closed
        searchCompanyMock.mockImplementation(siret => {
          return {
            siret,
            etatAdministratif: "F",
            address: "Company address",
            name: "Company name"
          };
        });
      });

      it("emitter signature", async () => {
        await testSigningBsda("EMISSION", emitterUser);
      });

      it("worker signature", async () => {
        await testSigningBsda("WORK", workerUser);
      });

      it("transporter signature", async () => {
        await testSigningBsda("TRANSPORT", transporterUser);
      });

      it("destination signature", async () => {
        await testSigningBsda("OPERATION", destinationUser);
      });
    });

    describe("dormant sirets", () => {
      beforeAll(async () => {
        await createTestData();

        // All companies are open...
        searchCompanyMock.mockImplementation(siret => {
          return {
            siret,
            etatAdministratif: "O",
            address: "Company address",
            name: "Company name"
          };
        });

        // ...but dormant
        await prisma.company.updateMany({
          data: {
            isDormantSince: new Date()
          }
        });
      });

      it("emitter signature", async () => {
        await testSigningBsda("EMISSION", emitterUser);
      });

      it("worker signature", async () => {
        await testSigningBsda("WORK", workerUser);
      });

      it("transporter signature", async () => {
        await testSigningBsda("TRANSPORT", transporterUser);
      });

      it("destination signature", async () => {
        await testSigningBsda("OPERATION", destinationUser);
      });
    });
  });
});
