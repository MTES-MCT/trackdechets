import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  UserWithCompany,
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createBsffBeforeOperation,
  createBsffBeforeReception,
  createBsffBeforeTransport,
  createFicheIntervention
} from "../../../__tests__/factories";
import { prismaToZodBsff } from "../helpers";
import { ZodBsff } from "../schema";
import { parseBsff, parseBsffAsync } from "..";
import { BsffType, TransportMode } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { CompanySearchResult } from "../../../../companies/types";
import { searchCompany } from "../../../../companies/search";

jest.mock("../../../../companies/search");

function searchResult(companyName: string) {
  return {
    name: companyName,
    address: `Adresse ${companyName}`,
    statutDiffusionEtablissement: "O"
  } as CompanySearchResult;
}

describe("validation > parseBsff", () => {
  let emitter: UserWithCompany;
  let foreignTransporter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["PRODUCER"]
    });
    transporter = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: {
        create: {
          receiptNumber: "recepisse",
          validityLimit: new Date(),
          department: "07"
        }
      },
      companyTypes: ["TRANSPORTER"]
    });
    foreignTransporter = await userWithCompanyFactory("MEMBER", {
      orgId: "BE0541696005",
      vatNumber: "BE0541696005",
      siret: null,
      companyTypes: ["TRANSPORTER"]
    });

    destination = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["WASTEPROCESSOR"]
    });
  });

  afterEach(resetDatabase);

  describe("static validation rules", () => {
    // On teste ici les règles de validation statiques
    // définies par le schéma Zod "brut"

    it("should throw when e-mails are invalid", () => {
      const invalidZodBsff: ZodBsff = {
        emitterCompanyMail: "foo",
        destinationCompanyMail: "foo",
        transporters: [{ transporterCompanyMail: "foo" }]
      };

      expect.assertions(1);
      try {
        parseBsff(invalidZodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({ message: "E-mail émetteur invalide" }),
          expect.objectContaining({ message: "E-mail destinataire invalide" }),
          expect.objectContaining({ message: "E-mail transporteur invalide" })
        ]);
      }
    });

    it("should parse correctly when e-mails are valid", () => {
      const validZodBsff = {
        emitterCompanyMail: "john.snow@trackdechets.fr",
        destinationCompanyMail: "arya.stark@trackdechets.fr",
        transporters: [
          { transporterCompanyMail: "tyrion.lannister@trackdechets.fr" }
        ]
      };
      const parsed = parseBsff(validZodBsff);
      expect(parsed).toBeDefined();
    });

    it("should throw when N°SIRETs are invalid", () => {
      const zodBsff: ZodBsff = {
        emitterCompanySiret: "foo1",
        destinationCompanySiret: "foo2",
        transporters: [{ transporterCompanySiret: "foo3" }]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "foo1 n'est pas un numéro de SIRET valide"
          }),
          expect.objectContaining({
            message: "foo2 n'est pas un numéro de SIRET valide"
          }),
          expect.objectContaining({
            message: "foo3 n'est pas un numéro de SIRET valide"
          })
        ]);
      }
    });

    it("should parse correctly when n°SIRETs are valid", () => {
      const zodBsff: ZodBsff = {
        emitterCompanySiret: siretify(),
        destinationCompanySiret: siretify(),
        transporters: [{ transporterCompanySiret: siretify() }]
      };
      expect(parseBsff(zodBsff)).toBeDefined();
    });

    it("should throw when there is more than 5 transporters", () => {
      const zodBsff: ZodBsff = {
        transporters: [{}, {}, {}, {}, {}, {}]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Vous ne pouvez pas ajouter plus de 5 transporteurs"
          })
        ]);
      }
    });

    it("should parse correctly when there is 5 transporters or less", () => {
      const zodBsff: ZodBsff = {
        transporters: [{}, {}, {}, {}, {}]
      };
      expect(parseBsff(zodBsff)).toBeDefined();
    });

    it("should throw if a transporter has more than 2 plates", () => {
      const zodBsff: ZodBsff = {
        transporters: [{ transporterTransportPlates: ["1", "2", "3"] }]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Un maximum de 2 plaques d'immatriculation est accepté"
          })
        ]);
      }
    });

    it("should parse correctly if a transporter has 2 plates or less", () => {
      const zodBsff: ZodBsff = {
        transporters: [{ transporterTransportPlates: ["1", "2"] }]
      };
      expect(parseBsff(zodBsff)).toBeDefined();
    });

    it("should throw if planned operation code is not allowed", () => {
      const zodBsff: ZodBsff = {
        destinationPlannedOperationCode: "T1" as any
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Le code de l'opération de traitement ne fait pas partie de la" +
              " liste reconnue : R1, R2, R3, R5, R12, R13, D10, D13, D14, D15"
          })
        ]);
      }
    });

    it("should throw if waste code is not allowed", async () => {
      const zodBsff: ZodBsff = {
        wasteCode: "06 07 01*" as any
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Le code déchet ne fait pas partie de la liste reconnue" +
              " : 14 06 01*, 14 06 02*, 14 06 03*, 16 05 04*, 13 03 10*"
          })
        ]);
      }
    });

    it("should throw if packaging weight and volume are negative numbers", () => {
      const zodBsff: ZodBsff = {
        packagings: [
          {
            weight: -1,
            volume: -1,
            numero: "1",
            emissionNumero: "1",
            type: "BOUTEILLE"
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Conditionnements : le volume doit être supérieur à 0"
          }),
          expect.objectContaining({
            message: "Conditionnements : le poids doit être supérieur à 0"
          })
        ]);
      }
    });

    it(
      "should parse correctly if packaging weight and volume is 0" +
        " and bsff is created before MEP 2024.07.1",
      () => {
        const zodBsff: ZodBsff = {
          createdAt: new Date("2024-07-02"),
          packagings: [
            {
              weight: 0,
              volume: 0,
              numero: "1",
              emissionNumero: "1",
              type: "BOUTEILLE"
            }
          ]
        };
        expect(parseBsff(zodBsff)).toBeDefined();
      }
    );

    it(
      "should throw if packaging weight and volume are 0 " +
        "and bsff is created after MEP 2024.07.1",
      () => {
        const zodBsff: ZodBsff = {
          createdAt: new Date("2024-07-03T08:00:00"),
          packagings: [
            {
              weight: 0,
              volume: 0,
              numero: "1",
              emissionNumero: "1",
              type: "BOUTEILLE"
            }
          ]
        };
        expect.assertions(1);
        try {
          parseBsff(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message: "Conditionnements : le volume doit être supérieur à 0"
            }),
            expect.objectContaining({
              message: "Conditionnements : le poids doit être supérieur à 0"
            })
          ]);
        }
      }
    );

    it("should throw when repackaging more than 1 contenants", () => {
      const zodBsff: ZodBsff = {
        repackaging: ["contenant_1", "contenant_2"]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous ne pouvez saisir qu'un seul contenant lors d'une opération de reconditionnement"
          })
        ]);
      }
    });

    it("should throw if weight value is negative", () => {
      const zodBsff: ZodBsff = {
        weightValue: -1
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le poids doit être supérieur à 0"
          })
        ]);
      }
    });

    it("should not throw if weight value is 0 and bsff is created before MEP 2024.7.1", () => {
      const zodBsff: ZodBsff = {
        createdAt: new Date("2024-07-02"),
        weightValue: 0
      };
      expect(parseBsff(zodBsff)).toBeDefined();
    });

    it("should  throw if weight value is 0 and bsff is created after MEP 2024.7.1", () => {
      const zodBsff: ZodBsff = {
        createdAt: new Date("2024-07-03T08:00:00"),
        weightValue: 0
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le poids doit être supérieur à 0"
          })
        ]);
      }
    });
  });

  describe("refined rules", () => {
    // On teste ici les règles de validation définies par des méthodes
    // .superRefine et qui vérifient la cohérence des champs entre eux.

    test("field `other` is required on packaging when packagig type is `OTHER`", () => {
      const zodBsff: ZodBsff = {
        packagings: [
          {
            type: "AUTRE",
            weight: 1,
            other: "",
            numero: "1",
            emissionNumero: "1"
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Conditionnement : le champ `other` doit être précisée pour le conditionnement 'AUTRE'."
          })
        ]);
      }
    });

    test("field `other` should not be set when packagig type is not `OTHER`", () => {
      const zodBsff: ZodBsff = {
        packagings: [
          {
            type: "BOUTEILLE",
            other: "bouteille",
            weight: 1,
            numero: "1",
            emissionNumero: "1"
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Conditionnement : le champ `other` ne peut être renseigné que lorsque le type de conditionnement est 'AUTRE'."
          })
        ]);
      }
    });

    test("it should not be possible to set a weight greater than MAX_WEIGHT_TONNES", async () => {
      const zodBsff: ZodBsff = {
        packagings: [
          {
            type: "BOUTEILLE",
            weight: 100000000,
            numero: "1",
            emissionNumero: "1"
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "le poids doit être inférieur à 50000 tonnes"
          })
        ]);
      }
    });

    test(
      "it should not be possible to set a weight greater than MAX_WEIGHT_BY_ROAD_TONNES" +
        " when transportMode is ROAD",
      async () => {
        const zodBsff: ZodBsff = {
          transporters: [{ transporterTransportMode: TransportMode.ROAD }],
          weightValue: 50000
        };
        expect.assertions(1);
        try {
          parseBsff(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message:
                "le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
            })
          ]);
        }
      }
    );

    it(
      "should not be possible to add fiche d'interventions when" +
        " emitter type is not COLLECTE_PETITE_QUANTITES",
      async () => {
        const zodBsff: ZodBsff = {
          type: "TRACER_FLUIDE",
          ficheInterventions: ["id"]
        };
        expect.assertions(1);
        try {
          await parseBsffAsync(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message:
                "Le type de BSFF choisi ne permet pas d'associer des fiches d'intervention."
            })
          ]);
        }
      }
    );

    test("fiche d'intervention operateur should be bsff emitter", async () => {
      const operateur = await userWithCompanyFactory();
      const detenteur = await userWithCompanyFactory();
      const ficheIntervention = await createFicheIntervention({
        operateur,
        detenteur
      });
      const zodBsff: ZodBsff = {
        type: "COLLECTE_PETITES_QUANTITES",
        // emitter of BSFF is different from fiche d'intervention operateur
        emitterCompanySiret: siretify(),
        ficheInterventions: [ficheIntervention.id]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: `L'opérateur identifié sur la fiche d'intervention ${ficheIntervention.numero} ne correspond pas à l'émetteur de BSFF`
          })
        ]);
      }
    });
  });

  describe("required fields rules", () => {
    test("no fields should be required at initial state", () => {
      expect(parseBsff({})).toBeDefined();
    });

    test("required emission fields should be present for emission signature", () => {
      expect.assertions(1);
      try {
        parseBsff({}, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ emitterCompanyName est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ emitterCompanySiret est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ emitterCompanyAddress est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ emitterCompanyContact est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ emitterCompanyPhone est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ emitterCompanyMail est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ wasteCode est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ wasteDescription est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ wasteAdr est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ weightValue est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanyName est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanySiret est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanyAddress est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanyContact est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanyPhone est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationPlannedOperationCode est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ destinationCompanyMail est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ packagings est obligatoire."
          })
        ]);
      }
    });

    test("empty packagings array should be considered as a missing value", async () => {
      const bsff = await createBsffBeforeEmission({ emitter, destination });
      const zodBsff = { ...prismaToZodBsff(bsff), packagings: [] };
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ packagings est obligatoire."
          })
        ]);
      }
    });

    test("empty packaging numero should not be valid at emission signature", async () => {
      const bsff = await createBsffBeforeEmission(
        { emitter, destination },
        { packagingData: { numero: "", emissionNumero: "" } }
      );
      const zodBsff = prismaToZodBsff(bsff);
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Conditionnements : le numéro d'identification est requis"
          })
        ]);
      }
    });

    it("should parse correctly at emission signature when all required fields are present", async () => {
      const bsff = await createBsffBeforeEmission({ emitter, destination });
      const zodBsff = prismaToZodBsff(bsff);
      expect(
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" })
      ).toBeDefined();
    });

    test("`forwarding` should not be empty when type is REEXPEDITION", async () => {
      const bsff = await createBsffBeforeEmission({ emitter, destination });
      const zodBsff = {
        ...prismaToZodBsff(bsff),
        type: BsffType.REEXPEDITION,
        forwarding: []
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ forwarding est obligatoire."
          })
        ]);
      }
    });

    test("`grouping` should not be empty when type is GROUPING", async () => {
      const bsff = await createBsffBeforeEmission({ emitter, destination });
      const zodBsff = {
        ...prismaToZodBsff(bsff),
        type: BsffType.GROUPEMENT,
        grouping: []
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ grouping est obligatoire."
          })
        ]);
      }
    });

    test("`repackaging` should not be empty when type is REPACKAGING", async () => {
      const bsff = await createBsffBeforeEmission({ emitter, destination });
      const zodBsff = {
        ...prismaToZodBsff(bsff),
        type: BsffType.RECONDITIONNEMENT,
        repackaging: []
      };
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "EMISSION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ repackaging est obligatoire."
          })
        ]);
      }
    });

    test("required transport fields should be present at transporter signature", async () => {
      const bsff = await createBsffAfterEmission({ emitter, destination });
      const zodBsff = prismaToZodBsff(bsff);
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le nom du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "Le SIRET du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "L'adresse du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "Le nom de contact du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "Le téléphone du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "L'email du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message: "Le numéro de TVA du transporteur n° 1 est obligatoire."
          }),
          expect.objectContaining({
            message:
              "Le numéro de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "La date de validité du récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message: "L'immatriculation du transporteur n° 1 est obligatoire."
          })
        ]);
      }
    });

    it("should parse correctly at transporter signature when all required fields are present", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter,
        destination
      });
      const zodBsff = prismaToZodBsff(bsff);
      expect(
        parseBsff(zodBsff, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });

    test("recepisse is not required at transport signature when transporter is foreign", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter: foreignTransporter,
        destination
      });
      const zodBsff = prismaToZodBsff(bsff);
      expect(
        parseBsff(
          {
            ...zodBsff,
            transporters: [
              {
                ...zodBsff.transporters![0],
                transporterRecepisseDepartment: null,
                transporterRecepisseNumber: null,
                transporterRecepisseIsExempted: false,
                transporterCompanySiret: null
              }
            ]
          },
          { currentSignatureType: "TRANSPORT" }
        )
      ).toBeDefined();
    });

    test("recepisse is not required at transporter signature when transport mode is not road", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter,
        destination
      });
      const zodBsff = prismaToZodBsff(bsff);
      expect(
        parseBsff(
          {
            ...zodBsff,
            transporters: [
              {
                ...zodBsff.transporters![0],
                transporterRecepisseDepartment: null,
                transporterRecepisseNumber: null,
                transporterRecepisseIsExempted: false,
                transporterTransportMode: TransportMode.AIR
              }
            ]
          },
          { currentSignatureType: "TRANSPORT" }
        )
      ).toBeDefined();
    });

    test("immat plates are not required at transporter signature when transport mode is not road", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter,
        destination
      });
      const zodBsff = prismaToZodBsff(bsff);
      expect(
        parseBsff(
          {
            ...zodBsff,
            transporters: [
              {
                ...zodBsff.transporters![0],
                transporterTransportPlates: [],
                transporterTransportMode: TransportMode.AIR
              }
            ]
          },
          { currentSignatureType: "TRANSPORT" }
        )
      ).toBeDefined();
    });

    test("required fields should be present at reception signature", async () => {
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter,
        destination
      });
      const zodBsff = prismaToZodBsff(bsff);
      expect.assertions(1);
      try {
        parseBsff(zodBsff, { currentSignatureType: "RECEPTION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ destinationReceptionDate est obligatoire."
          })
        ]);
      }
    });

    it(
      "should parse correctly at reception signature" +
        " when all required fields are present",
      async () => {
        const bsff = await createBsffBeforeReception({
          emitter,
          transporter,
          destination
        });
        const zodBsff = prismaToZodBsff(bsff);
        expect(
          parseBsff(zodBsff, { currentSignatureType: "RECEPTION" })
        ).toBeDefined();
      }
    );
  });

  describe("company profiles rules", () => {
    test("destination should be registered in Trackdechets", async () => {
      const randomSiret = siretify();
      const zodBsff: ZodBsff = { destinationCompanySiret: randomSiret };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: `L'établissement avec le SIRET ${randomSiret} n'est pas inscrit sur Trackdéchets`
          })
        ]);
      }
    });

    test("destination should be registered with good profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const zodBsff: ZodBsff = { destinationCompanySiret: company.siret };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "L'installation de destination ou d’entreposage ou de reconditionnement avec le" +
              ` SIRET "${company.siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation` +
              " de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être" +
              " visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation" +
              " pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets" +
              " Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("transporter should be registered in Trackdéchets", async () => {
      const randomSiret = siretify();
      const zodBsff: ZodBsff = {
        transporters: [{ transporterCompanySiret: randomSiret }]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: `L'établissement avec le SIRET ${randomSiret} n'est pas inscrit sur Trackdéchets`
          })
        ]);
      }
    });

    test("foreign transporter should be registered in Trackdéchets", async () => {
      const randomVatNumber = "IT13029381004";
      const zodBsff: ZodBsff = {
        transporters: [{ transporterCompanyVatNumber: randomVatNumber }]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: `Le transporteur avec le n°de TVA ${randomVatNumber} n'est pas inscrit sur Trackdéchets`
          })
        ]);
      }
    });

    test("transporter should be registered with good profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const zodBsff: ZodBsff = {
        transporters: [{ transporterCompanySiret: company.siret }]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est` +
              " pas inscrit sur Trackdéchets en tant qu'entreprise de transport." +
              " Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise" +
              " pour qu'il modifie le profil de l'établissement depuis l'interface" +
              " Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("foreign transporter should be registered with good profike", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        vatNumber: "IT13029381004",
        siret: null
      });
      const zodBsff: ZodBsff = {
        transporters: [{ transporterCompanyVatNumber: company.vatNumber }]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber})` +
              " n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport." +
              " Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise" +
              " pour qu'il modifie le profil de l'établissement depuis l'interface" +
              " Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("emitter can transport its own waste if recepisse exemption is true", async () => {
      const bsff = await createBsffBeforeTransport(
        {
          emitter,
          transporter: emitter,
          destination
        },
        { transporterData: { transporterRecepisseIsExempted: true } }
      );
      const zodBsff: ZodBsff = prismaToZodBsff(bsff);
      expect(
        await parseBsffAsync(zodBsff, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });
  });

  describe("previousPackagings rules", () => {
    it("should throw if `forwarding` is defined and bsff type is not REEXPEDITION", async () => {
      const zodBsff: ZodBsff = {
        type: "COLLECTE_PETITES_QUANTITES",
        forwarding: ["contenant_1"]
      };
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous devez sélectionner le type de BSFF `REEXPEDITION` avec le paramètre `forwarding`"
          })
        ]);
      }
    });

    it("should throw if `repackaging` is defined and bsff type is not RECONDITIONNEMENT", async () => {
      const zodBsff: ZodBsff = {
        type: "COLLECTE_PETITES_QUANTITES",
        repackaging: ["contenant_1"]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous devez sélectionner le type de BSFF `RECONDITIONNEMENT` avec le paramètre `repackaging`"
          })
        ]);
      }
    });

    it("should throw if `grouping` is defined and bsff type is not GROUPEMENT", async () => {
      const zodBsff: ZodBsff = {
        type: "COLLECTE_PETITES_QUANTITES",
        grouping: ["contenant_1"]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous devez sélectionner le type de BSFF `GROUPEMENT` avec le paramètre `repackaging`"
          })
        ]);
      }
    });

    it("should throw if emitterCompanySiret is not specified when adding previous packagings (%s)", async () => {
      const zodBsff: ZodBsff = {
        type: "REEXPEDITION",
        forwarding: ["contenant_1"]
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous devez renseigner le siret de l'installation émettrice" +
              " du nouveau BSFF en cas de groupement, réexpédition ou reéxpédition"
          })
        ]);
      }
    });

    it("should throw if forwarding packagings ids are not found", async () => {
      const zodBsff: ZodBsff = {
        type: "REEXPEDITION",
        forwarding: ["not_found"],
        emitterCompanySiret: siretify()
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Les identifiants de contenants de fluide à réexpédier not_found n'existent pas"
          })
        ]);
      }
    });

    it("should throw if grouping packagings ids are not found", async () => {
      const zodBsff: ZodBsff = {
        type: "GROUPEMENT",
        grouping: ["not_found"],
        emitterCompanySiret: siretify()
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Les identifiants de contenants de fluide à grouper not_found n'existent pas"
          })
        ]);
      }
    });

    it("should throw if repackaging packagings ids are not found", async () => {
      const zodBsff: ZodBsff = {
        type: "RECONDITIONNEMENT",
        repackaging: ["not_found"],
        emitterCompanySiret: siretify()
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Les identifiants de contenants de fluide à reconditionner not_found n'existent pas"
          })
        ]);
      }
    });

    it("should thow when grouping packagings of different waste codes", async () => {
      const initialBsff1 = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            acceptationWasteCode: "14 06 01*",
            operationCode: "R12"
          }
        }
      );

      const initialBsff2 = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            acceptationWasteCode: "14 06 02*",
            operationCode: "R12"
          }
        }
      );
      const zodBsff: ZodBsff = {
        type: "GROUPEMENT",
        grouping: [
          initialBsff1.packagings[0].id,
          initialBsff2.packagings[0].id
        ],
        emitterCompanySiret: destination.company.siret
      };

      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous ne pouvez pas grouper des contenants ayant des codes déchet différents : 14 06 01*, 14 06 02*"
          })
        ]);
      }
    });

    it.each(["GROUPEMENT", "REEXPEDITION", "RECONDITIONNEMENT"])(
      "should throw when specifying no previous packagings in case of %p",
      async type => {
        const zodBsff: ZodBsff = {
          type: type as BsffType,
          repackaging: [],
          grouping: [],
          forwarding: []
        };

        expect.assertions(1);
        try {
          await parseBsffAsync(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message:
                "Vous devez saisir des contenants en transit en cas de groupement, reconditionnement ou réexpédition"
            })
          ]);
        }
      }
    );

    it(
      "should throw if emitter company siret does not" +
        " match destination of previous packaging",
      async () => {
        const initialBsff = await createBsffAfterOperation(
          {
            emitter,
            transporter,
            destination
          },
          {
            packagingData: {
              operationCode: "R12"
            }
          }
        );
        const zodBsff: ZodBsff = {
          id: getReadableId(ReadableIdPrefix.FF),
          type: "GROUPEMENT",
          grouping: [initialBsff.packagings[0].id],
          emitterCompanySiret: siretify()
        };
        expect.assertions(1);
        try {
          await parseBsffAsync(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message:
                `Le BSFF ${initialBsff.id} sur lequel apparait le` +
                ` contenant ${initialBsff.packagings[0].id} (${initialBsff.packagings[0].numero})` +
                ` n'a pas été traité sur l'installation émettrice du nouveau BSFF ${zodBsff.emitterCompanySiret}`
            })
          ]);
        }
      }
    );

    it("should throw if operation has not be signed on previous packaging", async () => {
      const initialBsff = await createBsffBeforeOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: "R12"
          }
        }
      );
      const packaging = initialBsff.packagings[0];
      const zodBsff: ZodBsff = {
        id: getReadableId(ReadableIdPrefix.FF),
        type: "GROUPEMENT",
        grouping: [packaging.id],
        emitterCompanySiret: destination.company.siret
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              `La signature de l'opération n'a pas encore été` +
              ` faite sur le contenant ${packaging.id} - ${packaging.numero}`
          })
        ]);
      }
    });

    it("should throw if a final operation has been done on the previous packaging", async () => {
      const initialBsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: "R1"
          }
        }
      );
      const packaging = initialBsff.packagings[0];
      const zodBsff: ZodBsff = {
        id: getReadableId(ReadableIdPrefix.FF),
        type: "GROUPEMENT",
        grouping: [packaging.id],
        emitterCompanySiret: destination.company.siret
      };
      expect.assertions(1);
      try {
        await parseBsffAsync(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              `Une opération de traitement finale a été déclarée sur le contenant n°${packaging.id} (${packaging.numero}). ` +
              `Vous ne pouvez pas l'ajouter sur un BSFF de groupement, reconditionnement ou réexpédition`
          })
        ]);
      }
    });

    it(
      "should throw if packaging has already been grouped, repackaged" +
        " or forwarded",
      async () => {
        const initialBsff = await createBsffAfterOperation(
          {
            emitter,
            transporter,
            destination
          },
          {
            packagingData: {
              operationCode: "R12"
            }
          }
        );

        // packaging is already grouped
        await createBsff({}, { previousPackagings: initialBsff.packagings });

        const packaging = initialBsff.packagings[0];
        const zodBsff: ZodBsff = {
          id: getReadableId(ReadableIdPrefix.FF),
          type: "GROUPEMENT",
          grouping: [packaging.id],
          emitterCompanySiret: destination.company.siret
        };

        expect.assertions(1);
        try {
          await parseBsffAsync(zodBsff);
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message: `Le contenant n°${packaging.id} (${packaging.numero}) a déjà été réexpédié, reconditionné ou groupé dans un autre BSFF.`
            })
          ]);
        }
      }
    );
  });

  describe("sirenify transformers", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER");
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

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

      const zodBsff: ZodBsff = {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: "N'importe",
            transporterCompanyAddress: "Nawak"
          }
        ]
      };

      const parsed = await parseBsffAsync(zodBsff);

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
    });

    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER");
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

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

      const zodBsff: ZodBsff = {
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret
          }
        ]
      };

      const parsed = await parseBsffAsync(zodBsff);

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
    });

    it("should not overwrite `name` and `address` based on SIRENE data for sealed fields", async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const worker = await userWithCompanyFactory("MEMBER");
      const broker = await userWithCompanyFactory("MEMBER");
      const intermediary1 = await userWithCompanyFactory("MEMBER");
      const intermediary2 = await userWithCompanyFactory("MEMBER");

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

      const zodBsff: ZodBsff = {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: "N'importe",
        emitterCompanyAddress: "Nawak",
        emitterEmissionSignatureDate: new Date(),
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: "N'importe",
        destinationCompanyAddress: "Nawak",
        transporters: [
          {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: "N'importe",
            transporterCompanyAddress: "Nawak"
          }
        ]
      };

      const parsed = await parseBsffAsync(zodBsff);

      expect(parsed.emitterCompanyName).toEqual(zodBsff.emitterCompanyName);
      expect(parsed.emitterCompanyAddress).toEqual(
        zodBsff.emitterCompanyAddress
      );
      expect(parsed.destinationCompanyName).toEqual(
        zodBsff.destinationCompanyName
      );
      expect(parsed.destinationCompanyAddress).toEqual(
        zodBsff.destinationCompanyAddress
      );
    });
  });
});
