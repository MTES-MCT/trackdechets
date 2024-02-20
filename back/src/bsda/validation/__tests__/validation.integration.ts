import { BsdaType, OperationMode, TransportMode } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
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
import { BsdaValidationContext } from "../types";
import { ZodError } from "zod";
import { CompanySearchResult } from "../../../companies/types";
import { searchCompany } from "../../../companies/search";
import { parseBsda, parseBsdaAsync } from "..";

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

    test("when type is COLLECTION_2710 and unused company fields are nulls", () => {
      // on COLLECTION_2710 Bsdas worker and trasporter fields are not used
      const parsed = parseBsda(
        {
          ...bsda,
          type: BsdaType.COLLECTION_2710,
          transporterCompanySiret: null,
          transporterCompanyName: null,
          workerCompanyName: null,
          workerCompanySiret: null
        },
        context
      );

      expect(parsed).toBeDefined();
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const parsed = parseBsda(
        {
          ...bsda,
          transporterCompanyVatNumber: foreignTransporter.vatNumber,
          transporterCompanyName: "transporteur BE",
          transporterRecepisseDepartment: null,
          transporterRecepisseNumber: null,
          transporterRecepisseIsExempted: null
        },
        context
      );
      expect(parsed).toBeDefined();
    });

    test("when a foreign transporter vat number is specified and transporter siret is null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const data = {
        ...bsda,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: foreignTransporter.vatNumber
      };

      const parsed = parseBsda(data, context);
      expect(parsed).toBeDefined();
    });

    test("when a foreign transporter vat number is specified and transporter siret is null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const data = {
        ...bsda,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: foreignTransporter.vatNumber
      };

      const parsed = parseBsda(data, context);
      expect(parsed).toBeDefined();
    });

    test("when transporter recepisse is not present and transport mode is not ROAD", () => {
      const data = {
        ...bsda,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null,
        transporterTransportMode: "AIR" as TransportMode
      };

      const parsed = parseBsda(data, context);
      expect(parsed).toBeDefined();
    });

    test("when transporter plate is not present and transport mode is not ROAD", () => {
      const data = {
        ...bsda,
        transporterTransportMode: "AIR" as TransportMode
      };
      const parsed = parseBsda(data, context);
      expect(parsed).toBeDefined();
    });

    test("when transport mode is ROAD & plates are defined", () => {
      const data = {
        ...bsda,
        transporterTransportMode: "ROAD" as TransportMode,
        transporterTransportPlates: ["TRANSPORTER-PLATES"]
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

      const data = {
        ...bsda,
        emittedCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        transporterRecepisseIsExempted: true
      };

      const parsed = parseBsda(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });
  });

  describe("BSDA should not be valid", () => {
    test("when type is COLLECTION_2710 and unused company fields are empty strings", () => {
      // on COLLECTION_2710 Bsdas worker and transporter fields are not used

      const data = {
        ...bsda,
        type: BsdaType.COLLECTION_2710,
        transporterCompanySiret: "",
        transporterCompanyName: "",
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
      const data = {
        ...bsda,
        emitterCompanySiret: "1"
      };
      const parseFn = () =>
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

      expect(parseFn).toThrow("1 n'est pas un numéro de SIRET valide");
    });

    test("when transporter siret is not valid", () => {
      const data = {
        ...bsda,
        transporterCompanySiret: "1"
      };

      const parseFn = () =>
        parseBsda(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });

      expect(parseFn).toThrow("1 n'est pas un numéro de SIRET valide");
    });

    test("when transporter VAT number is FR", () => {
      const data = {
        ...bsda,
        transporterCompanyVatNumber: "FR35552049447"
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
      const data = {
        ...bsda,
        transporterCompanySiret: "85001946400021"
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsda,
        transporterCompanySiret: company.siret
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsda,
        trasnporterCompanySiret: null,
        transporterCompanyVatNumber: "IT13029381004"
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
      const data = {
        ...bsda,
        transporterCompanyVatNumber: company.vatNumber
      };

      const parseFn = () => parseBsdaAsync(data, context);

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when destination siret is not valid", () => {
      const data = {
        ...bsda,
        destinationCompanySiret: "1"
      };

      const parseFn = () => parseBsda(data, context);

      expect(parseFn).toThrow("1 n'est pas un numéro de SIRET valide");
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data = {
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
      const data = {
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
              " modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when there is a french transporter and recepisse fields are null", async () => {
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const data = {
        ...bsda,
        type: BsdaType.OTHER_COLLECTIONS,
        transporterCompanySiret: transporterCompany.siret,
        transporterCompanyVatNumber: null,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null
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
              "Le numéro de récépissé du transporteur est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    test.each([undefined, [], [""]])(
      "when transporter plate is %p invalid and transporter mode is ROAD",
      async invalidValue => {
        const data = {
          ...bsda,
          transporterTransportMode: "ROAD" as TransportMode,
          transporterTransportPlates: invalidValue
        };

        try {
          parseBsda(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: "L'immatriculation du transporteur est obligatoire."
            })
          ]);
        }
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

      const data = {
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

      const data = {
        ...bsda,
        emittedCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        transporterRecepisseIsExempted: false
      };

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
              " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });
  });

  describe("Operation modes", () => {
    test.each([
      ["R 5", "REUTILISATION"],
      ["R 13", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data = {
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
      ["R 13", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data = {
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
      ["R 13", "VALORISATION_ENERGETIQUE"] // R 13 has no associated mode
    ])(
      "should fail if operation mode is not compatible with operation code (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const data = {
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
      const data = {
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
      const data = {
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

      const data = {
        ...bsda,
        transporterCompanySiret: company.siret,
        transporterCompanyVatNumber: company.vatNumber,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });
      expect(parsed.transporter).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: receipt.receiptNumber,
        transporterRecepisseDepartment: receipt.department,
        transporterRecepisseValidityLimit: receipt.validityLimit
      });
    });

    it("should remove transporter receipt when it does not exist in Company table", async () => {
      const company = await companyFactory();

      const data = {
        ...bsda,
        transporterCompanySiret: company.siret,
        transporterCompanyVatNumber: company.vatNumber,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: "null",
        transporterRecepisseDepartment: "42",
        transporterRecepisseValidityLimit: new Date()
      };

      const parsed = await parseBsdaAsync(data, {
        ...context,
        enableCompletionTransformers: true
      });
      expect(parsed.transporter).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });

    it("should empty workerCertification when worker is disabled", async () => {
      const data = {
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
      expect(parsed.bsda).toMatchObject({
        workerCertificationHasSubSectionFour: false,
        workerCertificationHasSubSectionThree: false,
        workerCertificationCertificationNumber: null,
        workerCertificationValidityLimit: null,
        workerCertificationOrganisation: null
      });
    });

    it("should auto-complete transportersOrgIds", async () => {
      const transporter = await companyFactory();
      const data = {
        ...bsda,
        transportersOrgIds: [],
        transporterCompanySiret: transporter.siret
      };
      const parsed = await parseBsdaAsync(data, context);
      expect(parsed.bsda.transportersOrgIds).toEqual([transporter.siret]);
    });
  });

  describe("Zod sirenify transformer", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER");
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

      const data = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: "N'importe",
        transporterCompanyAddress: "Nawak",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        workerCompanySiret: worker.company.siret,
        workerCompanyName: "N'importe",
        workerCompanyAddress: "Nawak",
        brokerCompanySiret: broker.company.siret,
        brokerCompanyName: "N'importe",
        brokerCompanyAddress: "Nawak",
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

      const { bsda: sirenified, transporter: sirenifiedTransporter } =
        await parseBsdaAsync(data, {
          ...context,
          enableCompletionTransformers: true
        });

      expect(sirenified.emitterCompanyName).toEqual(
        searchResults[emitter.company.siret!].name
      );
      expect(sirenified.emitterCompanyAddress).toEqual(
        searchResults[emitter.company.siret!].address
      );
      expect(sirenifiedTransporter.transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(sirenifiedTransporter.transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(sirenified.destinationCompanyName).toEqual(
        searchResults[destination.company.siret!].name
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        searchResults[destination.company.siret!].address
      );
      expect(sirenified.workerCompanyName).toEqual(
        searchResults[worker.company.siret!].name
      );
      expect(sirenified.workerCompanyAddress).toEqual(
        searchResults[worker.company.siret!].address
      );
      expect(sirenified.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(sirenified.brokerCompanyAddress).toEqual(
        searchResults[broker.company.siret!].address
      );
      expect(sirenified.intermediaries![0].name).toEqual(
        searchResults[intermediary1.company.siret!].name
      );
      expect(sirenified.intermediaries![0].address).toEqual(
        searchResults[intermediary1.company.siret!].address
      );
      expect(sirenified.intermediaries![1].name).toEqual(
        searchResults[intermediary2.company.siret!].name
      );
      expect(sirenified.intermediaries![1].address).toEqual(
        searchResults[intermediary2.company.siret!].address
      );
    });

    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER");
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

      const data = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationCompanySiret: destination.company.siret,
        workerCompanySiret: worker.company.siret,
        brokerCompanySiret: broker.company.siret
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

      const { bsda: sirenified, transporter: sirenifiedTransporter } =
        await parseBsdaAsync(data, {
          enableCompletionTransformers: true
        });

      expect(sirenified.emitterCompanyName).toEqual(
        searchResults[emitter.company.siret!].name
      );
      expect(sirenified.emitterCompanyAddress).toEqual(
        searchResults[emitter.company.siret!].address
      );
      expect(sirenifiedTransporter.transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(sirenifiedTransporter.transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(sirenified.destinationCompanyName).toEqual(
        searchResults[destination.company.siret!].name
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        searchResults[destination.company.siret!].address
      );
      expect(sirenified.workerCompanyName).toEqual(
        searchResults[worker.company.siret!].name
      );
      expect(sirenified.workerCompanyAddress).toEqual(
        searchResults[worker.company.siret!].address
      );
      expect(sirenified.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(sirenified.brokerCompanyAddress).toEqual(
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
      const broker = await userWithCompanyFactory("MEMBER");
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
      const data = {
        ...bsda,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        emitterEmissionSignatureDate: new Date(),
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: "N'importe",
        transporterCompanyAddress: "Nawak",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        workerCompanySiret: worker.company.siret,
        workerCompanyName: "N'importe",
        workerCompanyAddress: "Nawak",
        brokerCompanySiret: broker.company.siret,
        brokerCompanyName: "N'importe",
        brokerCompanyAddress: "Nawak",
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

      const { bsda: sirenified, transporter: sirenifiedTransporter } =
        await parseBsdaAsync(data, {
          ...context,
          enableCompletionTransformers: true
        });

      // Unchanged
      expect(sirenified.emitterCompanyName).toEqual(data.emitterCompanyName);
      expect(sirenified.emitterCompanyAddress).toEqual(
        data.emitterCompanyAddress
      );

      expect(sirenified.destinationCompanyName).toEqual(
        data.destinationCompanyName
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        data.destinationCompanyAddress
      );
      expect(sirenified.workerCompanyName).toEqual(data.workerCompanyName);
      expect(sirenified.workerCompanyAddress).toEqual(
        data.workerCompanyAddress
      );

      // Changed
      expect(sirenifiedTransporter.transporterCompanyName).toEqual(
        searchResults[transporter.company.siret!].name
      );
      expect(sirenifiedTransporter.transporterCompanyAddress).toEqual(
        searchResults[transporter.company.siret!].address
      );
      expect(sirenified.brokerCompanyName).toEqual(
        searchResults[broker.company.siret!].name
      );
      expect(sirenified.brokerCompanyAddress).toEqual(
        searchResults[broker.company.siret!].address
      );
      expect(sirenified.intermediaries![0].name).toEqual(
        searchResults[intermediary1.company.siret!].name
      );
      expect(sirenified.intermediaries![0].address).toEqual(
        searchResults[intermediary1.company.siret!].address
      );
      expect(sirenified.intermediaries![1].name).toEqual(
        searchResults[intermediary2.company.siret!].name
      );
      expect(sirenified.intermediaries![1].address).toEqual(
        searchResults[intermediary2.company.siret!].address
      );
    });
  });
});
