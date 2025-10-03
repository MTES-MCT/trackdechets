import {
  BsdaStatus,
  BsdaType,
  OperationMode,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  UserWithCompany,
  companyFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { bsdaFactory } from "../../__tests__/factories";
import {
  ZodBsda,
  ZodOperationEnum,
  ZodWorkerCertificationOrganismEnum
} from "../schema";
import { prismaToZodBsda } from "../helpers";
import {
  BsdaForParsingInclude,
  BsdaValidationContext,
  PrismaBsdaForParsing
} from "../types";
import { ZodError } from "zod";
import { searchCompany } from "../../../companies/search";
import { mergeInputAndParseBsdaAsync, parseBsda, parseBsdaAsync } from "..";
import type { BsdaInput, CompanySearchResult } from "@td/codegen-back";
import { prisma } from "@td/prisma";

jest.mock("../../../companies/search");

describe("BSDA parsing", () => {
  let bsda: ZodBsda;
  let context: BsdaValidationContext;

  beforeEach(async () => {
    const prismaBsda = await bsdaFactory({});
    bsda = prismaToZodBsda(prismaBsda);
    context = {
      enableCompletionTransformers: false,
      enablePreviousBsdasChecks: false,
      currentSignatureType: undefined
    };
  });

  afterEach(resetDatabase);

  describe("BSDA should be valid", () => {
    test("when all data is present", async () => {
      const parsed = parseBsda(bsda, context);
      expect(parsed).toBeDefined();
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });

      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseIsExempted: false,
            transporterCompanySiret: null,
            transporterCompanyVatNumber: foreignTransporter.vatNumber
          }
        ]
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when a foreign transporter vat number is specified and transporter siret is null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterCompanySiret: null,
            transporterCompanyVatNumber: foreignTransporter.vatNumber
          }
        ]
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transporter recepisse is not present and transport mode is not ROAD", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterRecepisseNumber: null,
            transporterRecepisseDepartment: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "AIR" as TransportMode
          }
        ]
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transporter plate is not present and transport mode is not ROAD before TRANSPORT signature", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportPlates: [],
            transporterTransportMode: "ROAD" as TransportMode
          }
        ]
      };
      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "EMISSION"
      });
      expect(parsed).toBeDefined();
    });

    test("when transporter plate is not present and transport mode is not ROAD", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportPlates: [],
            transporterTransportMode: "AIR" as TransportMode
          }
        ]
      };
      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transport mode is ROAD & plates are defined", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportMode: "ROAD" as TransportMode,
            transporterTransportPlates: ["AZ-12-BA"]
          }
        ]
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when emitter transport its own waste and recepisse exemption is true", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: emitterAndTransporter.siret,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterCompanySiret: emitterAndTransporter.siret,
            transporterRecepisseIsExempted: true
          }
        ]
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when a reception weight is filled and waste is accepted", async () => {
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
        destinationReceptionWeight: 1.5
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).toBeDefined();
    });

    test("when a reception weight is filled and waste is partially refused", async () => {
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus:
          WasteAcceptationStatus.PARTIALLY_REFUSED,
        destinationReceptionWeight: 1.5,
        destinationReceptionRefusalReason: "pas très très conforme"
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).toBeDefined();
    });

    test("when a reception weight is 0 and waste is refused", async () => {
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        destinationReceptionWeight: 0,
        destinationReceptionRefusalReason: "non conforme"
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).toBeDefined();
    });
  });

  describe("BSDA should not be valid", () => {
    test("when a reception weight is 0", async () => {
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionWeight: 0
      };

      const parseFn = () =>
        parseBsdaAsync(data, { ...context, currentSignatureType: "OPERATION" });

      await expect(parseFn).rejects.toThrow(
        "Le poids du déchet reçu doit être renseigné et non nul."
      );
    });

    test("when type is COLLECTION_2710 and unused company fields are empty strings", () => {
      // on COLLECTION_2710 Bsdas worker and transporter fields are not used

      const data: ZodBsda = {
        ...bsda,
        type: BsdaType.COLLECTION_2710,
        workerCompanyName: "",
        workerCompanySiret: ""
      };

      expect.assertions(1);

      try {
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Impossible de saisir un transporteur pour un bordereau de collecte en déchetterie."
          }),
          expect.objectContaining({
            message:
              "Impossible de saisir une entreprise de travaux pour un bordereau de collecte en déchetterie."
          })
        ]);
      }
    });

    test("when emitter siret is not valid", () => {
      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: "1"
      };
      const parseFn = () =>
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

      expect(parseFn).toThrow("1 n'est pas un SIRET valide");
    });

    test("when transporter siret is not valid", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: "1"
          }
        ]
      };

      const parseFn = () =>
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

      expect(parseFn).toThrow("1 n'est pas un SIRET valide");
    });

    test("when transporter VAT number is FR", () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanyVatNumber: "FR35552049447"
          }
        ]
      };

      const parseFn = () =>
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

      expect(parseFn).toThrow(
        "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      );
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: "85001946400021"
          }
        ]
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: company.siret
          }
        ]
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: null,
            transporterCompanyVatNumber: "IT13029381004"
          }
        ]
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        "Le transporteur avec le n°de TVA IT13029381004 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanyVatNumber: company.vatNumber
          }
        ]
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    test("when destination siret is not valid", () => {
      const data: ZodBsda = {
        ...bsda,
        destinationCompanySiret: "1"
      };

      const parseFn = () => parseBsda(data, context);

      expect(parseFn).toThrow("1 n'est pas un SIRET valide");
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data: ZodBsda = {
        ...bsda,
        destinationCompanySiret: "85001946400021"
      };
      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsda = {
        ...bsda,
        destinationCompanySiret: company.siret
      };

      expect.assertions(1);

      try {
        await parseBsdaAsync(data, context);
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite` +
              " sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc" +
              " pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il" +
              " modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
          })
        ]);
      }
    });

    test("when there is a french transporter and recepisse fields are null", async () => {
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const data: ZodBsda = {
        ...bsda,
        type: BsdaType.OTHER_COLLECTIONS,
        transporters: [
          {
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: transporterCompany.name,
            transporterCompanyAddress: transporterCompany.address,
            transporterCompanyContact: transporterCompany.contact,
            transporterCompanyMail: transporterCompany.contactEmail,
            transporterCompanyPhone: transporterCompany.contactPhone,
            transporterTransportPlates: ["AD-008-TS"],
            transporterCompanyVatNumber: null,
            transporterRecepisseIsExempted: false,
            transporterRecepisseNumber: null,
            transporterRecepisseDepartment: null,
            transporterTransportMode: "ROAD"
          }
        ]
      };

      expect.assertions(1);

      try {
        await parseBsdaAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets."
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets."
          }),
          expect.objectContaining({
            message:
              "La date de validité du récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets."
          })
        ]);
      }
    });

    test.each([undefined, []])(
      "when transporter plate is %p and transporter mode is ROAD",
      async invalidValue => {
        const data: ZodBsda = {
          ...bsda,
          transporters: [
            {
              ...bsda.transporters![0],
              transporterTransportMode: "ROAD" as TransportMode,
              transporterTransportPlates: invalidValue
            }
          ]
        };
        expect.assertions(1);
        try {
          parseBsda(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: "L'immatriculation du transporteur n° 1 est obligatoire."
            })
          ]);
        }
      }
    );

    test("when transporter plate is an empty string and transporter mode is ROAD", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportMode: "ROAD" as TransportMode,
            transporterTransportPlates: [""]
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    test("when transporter plate is too short and transporter mode is ROAD", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportMode: "ROAD" as TransportMode,
            transporterTransportPlates: ["x"]
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    test("when transporter plate is too long and transporter mode is ROAD", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportMode: "ROAD" as TransportMode,
            transporterTransportPlates: ["AZ-12-ER-98-AA-12"]
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    test("when transporter plate only contains whitespace and transporter mode is ROAD", async () => {
      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterTransportMode: "ROAD" as TransportMode,
            transporterTransportPlates: ["      "]
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le numéro de plaque fourni est incorrect"
          })
        ]);
      }
    });

    test.each(["XX", "AZ-ER-TY-UI-09-LP-87", "     "])(
      "when plate is incorrect (%p) on a bsda created before V20250201",
      async plate => {
        const data: ZodBsda = {
          ...bsda,
          createdAt: new Date("2025-01-10T00:00:00Z"),
          transporters: [
            {
              ...bsda.transporters![0],
              transporterTransportMode: "ROAD" as TransportMode,
              transporterTransportPlates: [plate] // should throw, but bsda was created before V20250201
            }
          ]
        };

        const parsed = parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

        expect(parsed).toBeDefined();
      }
    );

    test("when the grouped waste code is not equal to the grouping BSDA waste code", async () => {
      const grouping = [
        await bsdaFactory({
          opt: {
            wasteCode: "10 13 09*",
            status: "AWAITING_CHILD",
            destinationOperationCode: "D 15",
            destinationCompanySiret: bsda.emitterCompanySiret
          }
        })
      ];

      const data: ZodBsda = {
        ...bsda,
        type: "GATHERING" as BsdaType,
        grouping: grouping.map(bsda => bsda.id)
      };

      expect.assertions(1);
      try {
        await parseBsdaAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT",
          enablePreviousBsdasChecks: true
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Tous les bordereaux groupés doivent avoir le même code déchet que le bordereau de groupement."
          })
        ]);
      }
    });

    test("when emitter transport its own waste and recepisse exemption is not true", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: emitterAndTransporter.siret,
        transporters: [
          {
            ...bsda.transporters![0],
            transporterCompanySiret: emitterAndTransporter.siret,
            transporterRecepisseIsExempted: false
          }
        ]
      };
      expect.assertions(1);
      try {
        await parseBsdaAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${emitterAndTransporter.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
              " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
              " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
          })
        ]);
      }
    });

    test.each([-1, 0])(
      "when packagings volume is %p (not strictly positive)",
      async volume => {
        const data: ZodBsda = {
          ...bsda,
          packagings: [{ type: "BIG_BAG", quantity: 1, volume }]
        };
        try {
          await parseBsdaAsync(data, context);
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: "Le volume doit être un nombre positif"
            })
          ]);
        }
      }
    );
  });

  describe("Operation modes", () => {
    test.each([
      ["R 5", "REUTILISATION"],
      ["R 13", undefined],
      ["D 9 F", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data: ZodBsda = {
          ...bsda,
          destinationOperationCode: code as ZodOperationEnum,
          destinationOperationMode: mode
        };

        const parsed = parseBsda(data, {
          currentSignatureType: "EMISSION"
        });
        expect(parsed).toBeDefined();
      }
    );

    test.each([
      ["R 5", "REUTILISATION"],
      ["R 13", undefined],
      ["D 9 F", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data: ZodBsda = {
          ...bsda,
          destinationOperationCode: code as ZodOperationEnum,
          destinationOperationMode: mode
        };

        const parsed = parseBsda(data, {
          currentSignatureType: "TRANSPORT"
        });
        expect(parsed).toBeDefined();
      }
    );

    test.each([
      ["R 5", "VALORISATION_ENERGETIQUE"], // Correct modes are REUTILISATION or RECYCLAGE
      ["R 13", "VALORISATION_ENERGETIQUE"], // R 13 has no associated mode,
      ["D 9 F", "VALORISATION_ENERGETIQUE"] // Correct modes is ELIMINATION,
    ])(
      "should fail if operation mode is not compatible with operation code (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data: ZodBsda = {
          ...bsda,
          destinationOperationCode: code as ZodOperationEnum,
          destinationOperationMode: mode
        };

        expect.assertions(1);

        try {
          parseBsda(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
            })
          ]);
        }
      }
    );

    test("should not fail if operation code has associated operation modes but none is specified", () => {
      const data: ZodBsda = {
        ...bsda,
        destinationOperationCode: "R 5" as ZodOperationEnum,
        destinationOperationMode: undefined
      };

      const parsed = parseBsda(data, {
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("should fail if operation code has associated operation modes but none is specified", () => {
      const data: ZodBsda = {
        ...bsda,
        destinationOperationCode: "R 5" as ZodOperationEnum,
        destinationOperationMode: undefined
      };

      expect.assertions(1);
      try {
        parseBsda(data, {
          currentSignatureType: "OPERATION"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le mode de traitement est obligatoire."
          })
        ]);
      }
    });
  });

  describe("Zod completion transformers", () => {
    it("should update transporter receipt based on Company table", async () => {
      const company = await companyFactory();
      const receipt = await transporterReceiptFactory({ company });

      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: company.siret,
            transporterCompanyVatNumber: company.vatNumber,
            transporterRecepisseIsExempted: false,
            transporterRecepisseNumber: null,
            transporterRecepisseDepartment: null,
            transporterRecepisseValidityLimit: null
          }
        ]
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });
      expect(parsed.transporters![0]).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: receipt.receiptNumber,
        transporterRecepisseDepartment: receipt.department,
        transporterRecepisseValidityLimit: receipt.validityLimit
      });
    });

    it("should remove transporter receipt when it does not exist in Company table", async () => {
      const company = await companyFactory();

      const data: ZodBsda = {
        ...bsda,
        transporters: [
          {
            transporterCompanySiret: company.siret,
            transporterCompanyVatNumber: company.vatNumber,
            transporterRecepisseIsExempted: false,
            transporterRecepisseNumber: "null",
            transporterRecepisseDepartment: "42",
            transporterRecepisseValidityLimit: new Date()
          }
        ]
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });
      expect(parsed.transporters![0]).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });

    it("should empty workerCertification when worker is disabled", async () => {
      const data: ZodBsda = {
        ...bsda,
        workerIsDisabled: true,
        workerCompanyName: null,
        workerCompanySiret: null,
        workerCertificationHasSubSectionFour: true,
        workerCertificationHasSubSectionThree: true,
        workerCertificationCertificationNumber: "CERTIF",
        workerCertificationValidityLimit: new Date(),
        workerCertificationOrganisation:
          "AFNOR Certification" as ZodWorkerCertificationOrganismEnum
      };
      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });
      expect(parsed).toMatchObject({
        workerCertificationHasSubSectionFour: false,
        workerCertificationHasSubSectionThree: false,
        workerCertificationCertificationNumber: null,
        workerCertificationValidityLimit: null,
        workerCertificationOrganisation: null
      });
    });
  });

  describe("Zod sirenify transformer", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["BROKER"]
      });
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

      function searchResult(companyName: string) {
        return {
          name: companyName,
          address: `Adresse ${companyName}`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [emitter.company.siret!]: searchResult("émetteur"),
        [transporter.company.siret!]: searchResult("transporteur"),
        [destination.company.siret!]: searchResult("destinataire"),
        [worker.company.siret!]: searchResult("courtier"),
        [broker.company.siret!]: searchResult("broker"),
        [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
        [intermediary2.company.siret!]: searchResult("intermédiaire 2")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        workerCompanySiret: worker.company.siret,
        workerCompanyName: "N'importe",
        workerCompanyAddress: "Nawak",
        brokerCompanySiret: broker.company.siret,
        brokerCompanyName: "N'importe",
        brokerCompanyAddress: "Nawak",
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: "N'importe",
            transporterCompanyAddress: "Nawak"
          }
        ],
        intermediaries: [
          {
            siret: intermediary1.company.siret!,
            contact: "Mr intermédiaire 1",
            name: "N'importe",
            address: "Nawak"
          },
          {
            siret: intermediary2.company.siret!,
            contact: "Mr intermédiaire 2",
            name: "N'importe",
            address: "Nawak"
          }
        ]
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });

      expect(parsed.emitterCompanyName).toEqual(
        searchResults[emitter.company.siret!].name
      );
      expect(parsed.emitterCompanyAddress).toEqual(
        searchResults[emitter.company.siret!].address
      );
      expect(parsed.transporters![0].transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(parsed.transporters![0].transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(parsed.destinationCompanyName).toEqual(
        searchResults[destination.company.siret!].name
      );
      expect(parsed.destinationCompanyAddress).toEqual(
        searchResults[destination.company.siret!].address
      );
      expect(parsed.workerCompanyName).toEqual(
        searchResults[worker.company.siret!].name
      );
      expect(parsed.workerCompanyAddress).toEqual(
        searchResults[worker.company.siret!].address
      );
      expect(parsed.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(parsed.brokerCompanyAddress).toEqual(
        searchResults[broker.company.siret!].address
      );
      expect(parsed.intermediaries![0].name).toEqual(
        searchResults[intermediary1.company.siret!].name
      );
      expect(parsed.intermediaries![0].address).toEqual(
        searchResults[intermediary1.company.siret!].address
      );
      expect(parsed.intermediaries![1].name).toEqual(
        searchResults[intermediary2.company.siret!].name
      );
      expect(parsed.intermediaries![1].address).toEqual(
        searchResults[intermediary2.company.siret!].address
      );
    });

    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["BROKER"]
      });
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

      function searchResult(companyName: string) {
        return {
          name: companyName,
          address: `Adresse ${companyName}`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [emitter.company.siret!]: searchResult("émetteur"),
        [transporter.company.siret!]: searchResult("transporteur"),
        [destination.company.siret!]: searchResult("destinataire"),
        [worker.company.siret!]: searchResult("courtier"),
        [broker.company.siret!]: searchResult("broker"),
        [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
        [intermediary2.company.siret!]: searchResult("intermédiaire 2")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        workerCompanySiret: worker.company.siret,
        brokerCompanySiret: broker.company.siret,
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret
          }
        ]
        // FIXME suite PR 3087 - Ce cas n'est en fait jamais possible puisque
        // le schéma Zod impose de saisir les champs name, address et contact
        // dès le début, il faudrait implémenter des rules d'édition pour les
        // intermédiaires.
        //
        // intermediaries: [
        //   {
        //     siret: intermediary1.company.siret!
        //   },
        //   {
        //     siret: intermediary2.company.siret!
        //   }
        // ]
      };

      const parsed = await parseBsdaAsync(data, {
        enableCompletionTransformers: true
      });

      expect(parsed.emitterCompanyName).toEqual(
        searchResults[emitter.company.siret!].name
      );
      expect(parsed.emitterCompanyAddress).toEqual(
        searchResults[emitter.company.siret!].address
      );
      expect(parsed.transporters![0].transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(parsed.transporters![0].transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(parsed.destinationCompanyName).toEqual(
        searchResults[destination.company.siret!].name
      );
      expect(parsed.destinationCompanyAddress).toEqual(
        searchResults[destination.company.siret!].address
      );
      expect(parsed.workerCompanyName).toEqual(
        searchResults[worker.company.siret!].name
      );
      expect(parsed.workerCompanyAddress).toEqual(
        searchResults[worker.company.siret!].address
      );
      expect(parsed.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(parsed.brokerCompanyAddress).toEqual(
        searchResults[broker.company.siret!].address
      );
      // FIXME voir explication plus haut
      //
      // expect(sirenified.intermediaries![0].name).toEqual(
      //   searchResults[intermediary1.company.siret!].name
      // );
      // expect(sirenified.intermediaries![0].address).toEqual(
      //   searchResults[intermediary1.company.siret!].address
      // );
      // expect(sirenified.intermediaries![1].name).toEqual(
      //   searchResults[intermediary2.company.siret!].name
      // );
      // expect(sirenified.intermediaries![1].address).toEqual(
      //   searchResults[intermediary2.company.siret!].address
      // );
    });

    it("should not overwrite `name` and `address` based on SIRENE data for sealed fields", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["BROKER"]
      });
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

      function searchResult(companyName: string) {
        return {
          name: companyName,
          address: `Adresse ${companyName}`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [emitter.company.siret!]: searchResult("émetteur"),
        [transporter.company.siret!]: searchResult("transporteur"),
        [destination.company.siret!]: searchResult("destinataire"),
        [worker.company.siret!]: searchResult("courtier"),
        [broker.company.siret!]: searchResult("broker"),
        [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
        [intermediary2.company.siret!]: searchResult("intermédiaire 2")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      // BSDA signé par l'émetteur
      const data: ZodBsda = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        workerCompanySiret: worker.company.siret,
        workerCompanyName: "N'importe",
        workerCompanyAddress: "Nawak",
        brokerCompanySiret: broker.company.siret,
        brokerCompanyName: "N'importe",
        brokerCompanyAddress: "Nawak",
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: "N'importe",
            transporterCompanyAddress: "Nawak"
          }
        ],
        intermediaries: [
          {
            siret: intermediary1.company.siret!,
            contact: "Mr intermédiaire 1",
            name: "N'importe",
            address: "Nawak"
          },
          {
            siret: intermediary2.company.siret!,
            contact: "Mr intermédiaire 2",
            name: "N'importe",
            address: "Nawak"
          }
        ]
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });

      // Unchanged
      expect(parsed.emitterCompanyName).toEqual(data.emitterCompanyName);
      expect(parsed.emitterCompanyAddress).toEqual(data.emitterCompanyAddress);

      expect(parsed.destinationCompanyName).toEqual(
        data.destinationCompanyName
      );
      expect(parsed.destinationCompanyAddress).toEqual(
        data.destinationCompanyAddress
      );
      expect(parsed.workerCompanyName).toEqual(data.workerCompanyName);
      expect(parsed.workerCompanyAddress).toEqual(data.workerCompanyAddress);

      // Changed
      expect(parsed.transporters![0].transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(parsed.transporters![0].transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(parsed.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(parsed.brokerCompanyAddress).toEqual(
        searchResults[broker.company.siret!].address
      );
      expect(parsed.intermediaries![0].name).toEqual(
        searchResults[intermediary1.company.siret!].name
      );
      expect(parsed.intermediaries![0].address).toEqual(
        searchResults[intermediary1.company.siret!].address
      );
      expect(parsed.intermediaries![1].name).toEqual(
        searchResults[intermediary2.company.siret!].name
      );
      expect(parsed.intermediaries![1].address).toEqual(
        searchResults[intermediary2.company.siret!].address
      );
    });
  });

  describe("destinationReceptionRefusedWeight", () => {
    it("refusedWeight is not mandatory", async () => {
      // Given
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 10,
        destinationReceptionRefusedWeight: null
      };

      // When
      const parsed = parseBsda(data, context);

      // Then
      expect(parsed).toBeDefined();
    });

    it("refusedWeight cannot be defined if weight is not", async () => {
      // Given
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: null,
        destinationReceptionWeight: null,
        destinationReceptionRefusedWeight: 10
      };

      expect.assertions(1);

      // When
      try {
        parseBsda(data, context);
      } catch (err) {
        // Then
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "La quantité refusée (destinationReceptionRefusedWeight) ne peut être définie si la quantité reçue (destinationReceptionWeight) ne l'est pas"
          })
        ]);
      }
    });

    it.each([null, undefined, 0])(
      "waste is ACCEPTED > weight = 10 > refusedWeight can be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        // When
        const parsed = parseBsda(data, context);

        // Then
        expect(parsed).toBeDefined();
      }
    );

    it.each([5, 10, 15])(
      "waste is ACCEPTED > weight = 10 > refusedWeight can NOT be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        expect.assertions(1);

        // When
        try {
          parseBsda(data, context);
        } catch (err) {
          // Then
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "La quantité refusée (destinationReceptionRefusedWeight) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
            })
          ]);
        }
      }
    );

    it.each([null, undefined, 10])(
      "waste is REFUSED > weight = 10 > refusedWeight can be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "REFUSED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        // When
        const parsed = parseBsda(data, context);

        // Then
        expect(parsed).toBeDefined();
      }
    );

    it.each([0, 3, 15])(
      "waste is REFUSED > weight = 10 > refusedWeight can NOT be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "REFUSED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        expect.assertions(1);

        // When
        try {
          parseBsda(data, context);
        } catch (err) {
          // Then
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "La quantité refusée (destinationReceptionRefusedWeight) doit être égale à la quantité reçue (destinationReceptionWeight) si le déchet est refusé (REFUSED)"
            })
          ]);
        }
      }
    );

    it.each([0, 10, 15])(
      "waste is PARTIALLY_REFUSED > weight = 10 > refusedWeight can NOT be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        expect.assertions(1);

        // When
        try {
          parseBsda(data, context);
        } catch (err) {
          // Then
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "La quantité refusée (destinationReceptionRefusedWeight) doit être inférieure à la quantité reçue (destinationReceptionWeight) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
            })
          ]);
        }
      }
    );

    it.each([1, 5, 9.99])(
      "waste is PARTIALLY_REFUSED > weight = 10 > refusedWeight can be %p",
      async destinationReceptionRefusedWeight => {
        // Given
        const data: ZodBsda = {
          ...bsda,
          destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
          destinationReceptionWeight: 10,
          destinationReceptionRefusedWeight
        };

        // When
        const parsed = parseBsda(data, context);

        // Then
        expect(parsed).toBeDefined();
      }
    );

    it("refusedWeight must be positive", async () => {
      // Given
      const data: ZodBsda = {
        ...bsda,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 10,
        destinationReceptionRefusedWeight: -5
      };

      expect.assertions(1);

      // When
      try {
        parseBsda(data, context);
      } catch (err) {
        // Then
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le nombre doit être supérieur ou égal à 0"
          })
        ]);
      }
    });
  });
});

describe("mergeInputAndParseBsdaAsync", () => {
  let bsda: PrismaBsdaForParsing;
  let context: BsdaValidationContext;
  let emitter: UserWithCompany;
  let worker: UserWithCompany;
  let destination: UserWithCompany;
  let transporter: UserWithCompany;
  let transporter2: UserWithCompany;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory("MEMBER");
    worker = await userWithCompanyFactory("MEMBER");
    transporter = await userWithCompanyFactory("MEMBER");
    transporter2 = await userWithCompanyFactory("MEMBER");

    destination = await userWithCompanyFactory("MEMBER");

    const bsdaFromFactory = await bsdaFactory({
      opt: {
        status: "INITIAL",
        emitterCompanySiret: emitter.company.siret,
        workerCompanySiret: worker.company.siret,
        destinationCompanySiret: destination.company.siret
      },
      transporterOpt: { transporterCompanySiret: transporter.company.siret }
    });
    bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsdaFromFactory.id },
      include: BsdaForParsingInclude
    });

    context = {
      enableCompletionTransformers: false,
      enablePreviousBsdasChecks: false,
      currentSignatureType: undefined,
      user: emitter.user
    };
  });

  afterAll(resetDatabase);

  it("should be possible to update any fields when bsda status is INITIAL", async () => {
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: BsdaStatus.INITIAL
    };

    const input: BsdaInput = {
      waste: { code: "10 13 09*" }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["wasteCode"]);
  });

  it("should be possible for the emitter to update worker when bsda status is SIGNED_BY_PRODUCER", async () => {
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date()
    };

    const worker = await companyFactory();

    const input: BsdaInput = {
      worker: { company: { name: worker.name, siret: worker.siret } }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["workerCompanyName", "workerCompanySiret"]);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date()
    };
    const input: BsdaInput = { emitter: { company: { name: "ACME" } } };

    await expect(() =>
      mergeInputAndParseBsdaAsync(persisted, input, {
        ...context,
        user: destination.user
      })
    ).rejects.toThrow(
      "Le nom de l'entreprise émettrice a été verrouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to set a sealed field to null if it was empty", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: "",
        destinationCompanySiret: destination.company.siret
      }
    });

    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date(),
      emitterPickupSiteAddress: ""
    };

    const input: BsdaInput = { emitter: { pickupSite: { address: null } } };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      {
        ...context,
        user: destination.user
      }
    );

    expect(updatedFields).toEqual([]);
  });

  it("should be possible to set a sealed field to an empty string if it was null", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: null,
        destinationCompanySiret: destination.company.siret
      }
    });

    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date(),
      emitterPickupSiteAddress: null
    };

    const input: BsdaInput = { emitter: { pickupSite: { address: "" } } };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      {
        ...context,
        user: destination.user
      }
    );

    expect(updatedFields).toEqual([]);
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date()
    };

    const input: BsdaInput = {
      emitter: { company: { phone: "02 05 68 45 98" } }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["emitterCompanyPhone"]);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const grouping = [await bsdaFactory({})];
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        grouping: { connect: grouping.map(bsda => ({ id: bsda.id })) },
        destinationCompanySiret: destination.company.siret
      }
    });

    const persisted: PrismaBsdaForParsing = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        grouping: { connect: grouping.map(bsda => ({ id: bsda.id })) }
      },
      include: BsdaForParsingInclude
    });

    const input: BsdaInput = {
      grouping: grouping.map(bsda => bsda.id),
      emitter: { company: { phone: persisted.emitterCompanyPhone } }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual([]);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });

    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date()
    };

    const input: BsdaInput = {
      transporter: { transport: { plates: ["new-plates"] } }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["transporters"]);
  });
  it("should not be possible to update a field sealed by worker signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });

    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_WORKER",
      emitterEmissionSignatureDate: new Date(),
      workerWorkSignatureDate: new Date()
    };

    const input: BsdaInput = {
      worker: {
        work: {
          hasEmitterPaperSignature: !bsda.workerWorkHasEmitterPaperSignature
        }
      }
    };

    await expect(() =>
      mergeInputAndParseBsdaAsync(persisted, input, context)
    ).rejects.toThrow(
      "Le champ workerWorkHasEmitterPaperSignature a été verrouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to update a field not yet sealed by worker signature", async () => {
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_WORKER",
      emitterEmissionSignatureDate: new Date(),
      workerWorkSignatureDate: new Date()
    };

    const input: BsdaInput = {
      transporter: { transport: { plates: ["new-plate"] } }
    };

    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );
    expect(updatedFields).toEqual(["transporters"]);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const persisted: PrismaBsdaForParsing = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporters: {
          update: {
            where: { id: bsda.transporters![0].id },
            data: { transporterTransportSignatureDate: new Date() }
          }
        }
      },
      include: BsdaForParsingInclude
    });

    const input: BsdaInput = {
      transporter: { transport: { plates: ["new-plate"] } }
    };
    await expect(() =>
      mergeInputAndParseBsdaAsync(persisted, input, context)
    ).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
        " L'immatriculation du transporteur n°1 a été verrouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const persisted: PrismaBsdaForParsing = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporters: {
          update: {
            where: { id: bsda.transporters![0].id },
            data: { transporterTransportSignatureDate: new Date() }
          }
        }
      },
      include: BsdaForParsingInclude
    });

    const input: BsdaInput = {
      transporter: {
        company: { siret: bsda.transporters![0].transporterCompanySiret }
      }
    };
    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual([]);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const persisted: PrismaBsdaForParsing = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporters: {
          update: {
            where: { id: bsda.transporters![0].id },
            data: { transporterTransportSignatureDate: new Date() }
          }
        }
      },
      include: BsdaForParsingInclude
    });

    const input: BsdaInput = { destination: { reception: { weight: 300 } } };
    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["destinationReceptionWeight"]);
  });

  it("should be possible to add transporter N+1 when transporter N has signed", async () => {
    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: { number: 0, transporterCompanySiret: transporter2.company.siret }
    });
    const persisted: PrismaBsdaForParsing = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporters: {
          update: {
            where: { id: bsda.transporters![0].id },
            data: { transporterTransportSignatureDate: new Date() }
          }
        }
      },
      include: BsdaForParsingInclude
    });

    const input: BsdaInput = {
      transporters: [bsda.transporters![0].id, bsdaTransporter2.id]
    };
    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );

    expect(updatedFields).toEqual(["transporters"]);
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "PROCESSED",
      emitterEmissionSignatureDate: new Date(),
      workerWorkSignatureDate: new Date(),
      destinationOperationSignatureDate: new Date()
    };

    const input: BsdaInput = { destination: { reception: { weight: 300 } } };
    await expect(() =>
      mergeInputAndParseBsdaAsync(persisted, input, context)
    ).rejects.toThrow(
      "Le poids du déchet a été verrouillé via signature et ne peut pas être modifié."
    );
  });

  it("should be possible to update the destination contact & mail fields when the bsda status is signed by the emitter", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret
      }
    });

    const persisted: PrismaBsdaForParsing = {
      ...bsda,
      status: "SIGNED_BY_PRODUCER",
      emitterEmissionSignatureDate: new Date()
    };
    const input: BsdaInput = {
      destination: {
        company: {
          contact: "New John",
          phone: "0101010199",
          mail: "new@mail.com"
        }
      }
    };
    const { updatedFields } = await mergeInputAndParseBsdaAsync(
      persisted,
      input,
      context
    );
    expect(updatedFields).toEqual([
      "destinationCompanyContact",
      "destinationCompanyPhone",
      "destinationCompanyMail"
    ]);
  });
});
