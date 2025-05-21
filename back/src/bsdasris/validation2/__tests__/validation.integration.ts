import { CompanySearchResult } from "@td/codegen-back";
import { resetDatabase } from "../../../../integration-tests/helper";
import { Decimal } from "decimal.js";
import {
  UserWithCompany,
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { searchCompany } from "../../../companies/search";
import { ZodBsdasri } from "../schema";
import { parseBsdasri, parseBsdasriAsync } from "..";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData,
  readyToTakeOverData
} from "../../__tests__/factories";
import { prismaToZodBsdasri } from "../helpers";
import { BsdasriValidationContext } from "../types";

jest.mock("../../../companies/search");

function searchResult(companyName: string) {
  return {
    name: companyName,
    address: `Adresse ${companyName}`,
    statutDiffusionEtablissement: "O"
  } as CompanySearchResult;
}

describe("validation2 > parseBsdasri", () => {
  let bsdasri: ZodBsdasri;
  let context: BsdasriValidationContext;

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
    const prismaBsdasri = await bsdasriFactory({
      opt: {
        ...initialData,
        ...readyToPublishData(emitter.company),
        ...readyToTakeOverData(transporter.company),

        destinationCompanySiret: destination.company.siret,
        transporterWasteWeightValue: 11
      }
    });
    bsdasri = prismaToZodBsdasri({
      ...prismaBsdasri,
      grouping: [],
      synthesizing: []
    });
    context = {
      currentSignatureType: undefined
    };
  });

  afterEach(resetDatabase);

  describe("static validation2 rules", () => {
    // On teste ici les règles de validation2 statiques
    // définies par le schéma Zod "brut"

    it("when all data is present", async () => {
      const parsed = parseBsdasri(bsdasri, context);
      expect(parsed).toBeDefined();
    });

    it("should throw when e-mails are invalid", () => {
      const invalidZodBsdasri: ZodBsdasri = {
        ...bsdasri,
        emitterCompanyMail: "foo",
        destinationCompanyMail: "foo",
        transporterCompanyMail: "foo"
      };

      expect.assertions(1);
      try {
        parseBsdasri(invalidZodBsdasri);
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ message: "E-mail émetteur invalide" }),

            expect.objectContaining({
              message: "E-mail transporteur invalide"
            }),

            expect.objectContaining({ message: "E-mail destinataire invalide" })
          ])
        );
      }
    });

    it("should throw when N°SIRETs are invalid", () => {
      const invalidZodBsdasri: ZodBsdasri = {
        ...bsdasri,
        emitterCompanySiret: "foo1",
        destinationCompanySiret: "foo2",
        transporterCompanySiret: "foo3"
      };
      expect.assertions(1);
      try {
        parseBsdasri(invalidZodBsdasri);
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: "Émetteur : foo1 n'est pas un numéro de SIRET valide"
            }),

            expect.objectContaining({
              message: "Destination : foo2 n'est pas un numéro de SIRET valide"
            }),

            expect.objectContaining({
              message: "Transporteur : foo3 n'est pas un numéro de SIRET valide"
            })
          ])
        );
      }
    });

    it("should parse correctly when n°SIRETs are valid", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        emitterCompanySiret: siretify(),
        destinationCompanySiret: siretify(),
        transporterCompanySiret: siretify()
      };
      expect(parseBsdasri(zodBsdasri)).toBeDefined();
    });

    it.only("should parse correctly when transporter vat is provided", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanyVatNumber: foreignTransporter.company.vatNumber,
        transporterCompanySiret: null,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      };

      expect(parseBsdasri(zodBsdasri, {})).toBeDefined();
    });

    // it("should throw if a transporter has more than 2 plates", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     transporters: [
    //       { transporterTransportPlates: ["AA-12-AA", "AA-12-AB", "AA-12-AC"] }
    //     ]
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message: "Un maximum de 2 plaques d'immatriculation est accepté"
    //       })
    //     ]);
    //   }
    // });

    // it("should throw if transporter plate number is too short", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     transporters: [
    //       {
    //         transporterTransportPlates: ["AA"]
    //       }
    //     ]
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message:
    //           "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
    //       })
    //     ]);
    //   }
    // });

    // it("should throw if transporter plate number is too long", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     transporters: [
    //       {
    //         transporterTransportPlates: ["AZ-ER-TY-UI-09-LP-87"]
    //       }
    //     ]
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message:
    //           "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
    //       })
    //     ]);
    //   }
    // });

    // it("should throw if transporter contains only whitespace", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     transporters: [
    //       {
    //         transporterTransportPlates: ["      "]
    //       }
    //     ]
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message: "Le numéro de plaque fourni est incorrect"
    //       })
    //     ]);
    //   }
    // });

    // it.each(["XX", "AZ-ER-TY-UI-09-LP-87", "     "])(
    //   "should be valid if transporter plate number is incorrect (%p) on a bsff created before V20250201",
    //   plate => {
    //     const zodBsdasri: ZodBsdasri = {
    //       createdAt: new Date("2025-01-10T00:00:00Z"),
    //       transporters: [
    //         {
    //           transporterTransportPlates: [plate]
    //         }
    //       ]
    //     };
    //
    //     const parsed = parseBsdasri(zodBsdasri);
    //     expect(parsed).toBeDefined();
    //   }
    // );

    // it("should parse correctly if a transporter has 2 plates or less", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     transporters: [{ transporterTransportPlates: ["AA-12-AA", "AA-12-AB"] }]
    //   };
    //   expect(parseBsdasri(zodBsdasri)).toBeDefined();
    // });

    // it("should throw if planned operation code is not allowed", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     destinationPlannedOperationCode: "T1" as any
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message:
    //           "Le code de l'opération de traitement ne fait pas partie de la" +
    //           " liste reconnue : R1, R2, R3, R5, R12, R13, D10, D13, D14, D15"
    //       })
    //     ]);
    //   }
    // });

    // it("should throw if waste code is not allowed", async () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     wasteCode: "06 07 01*" as any
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message:
    //           "Le code déchet ne fait pas partie de la liste reconnue" +
    //           " : 14 06 01*, 14 06 02*, 14 06 03*, 16 05 04*, 13 03 10*"
    //       })
    //     ]);
    //   }
    // });

    // it("should throw if packaging weight and volume are negative numbers", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     packagings: [
    //       {
    //         weight: -1,
    //         volume: -1,
    //         numero: "1",
    //         emissionNumero: "1",
    //         type: "BOUTEILLE"
    //       }
    //     ]
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message: "Conditionnements : le volume doit être supérieur à 0"
    //       }),
    //       expect.objectContaining({
    //         message: "Conditionnements : le poids doit être supérieur à 0"
    //       })
    //     ]);
    //   }
    // });

    // it(
    //   "should parse correctly if packaging weight and volume is 0" +
    //     " and bsff is created before MEP 2024.07.1",
    //   () => {
    //     const zodBsdasri: ZodBsdasri = {
    //       createdAt: new Date("2024-07-02"),
    //       packagings: [
    //         {
    //           weight: 0,
    //           volume: 0,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect(parseBsdasri(zodBsdasri)).toBeDefined();
    //   }
    // );

    // it(
    //   "should throw if packaging weight and volume are 0 " +
    //     "and bsff is created after MEP 2024.07.1",
    //   () => {
    //     const zodBsdasri: ZodBsdasri = {
    //       createdAt: new Date("2024-07-03T08:00:00"),
    //       packagings: [
    //         {
    //           weight: 0,
    //           volume: 0,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect.assertions(1);
    //     try {
    //       parseBsdasri(zodBsdasri);
    //     } catch (e) {
    //       expect(e.errors).toEqual([
    //         expect.objectContaining({
    //           message: "Conditionnements : le volume doit être supérieur à 0"
    //         }),
    //         expect.objectContaining({
    //           message: "Conditionnements : le poids doit être supérieur à 0"
    //         })
    //       ]);
    //     }
    //   }
    // );

    // it.each([null, undefined])(
    //   "should parse correctly if packaging volume is %p" +
    //     " and bsff is created before MEP 2024.09.1",
    //   v => {
    //     const zodBsdasri: ZodBsdasri = {
    //       isDraft: false,
    //       createdAt: new Date("2024-09-23"),
    //       packagings: [
    //         {
    //           weight: 1,
    //           volume: v,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect(parseBsdasri(zodBsdasri)).toBeDefined();
    //   }
    // );

    // it.each([null, undefined])(
    //   "should throw if packaging volume is %p " +
    //     "and bsff is created after MEP 2024.09.1",
    //   v => {
    //     const zodBsdasri: ZodBsdasri = {
    //       createdAt: new Date("2024-09-24T08:00:00"),
    //       isDraft: false,
    //       packagings: [
    //         {
    //           weight: 1,
    //           volume: v,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect.assertions(1);
    //     try {
    //       parseBsdasri(zodBsdasri);
    //     } catch (e) {
    //       expect(e.errors).toEqual([
    //         expect.objectContaining({
    //           message: "Conditionnements : le volume est requis"
    //         })
    //       ]);
    //     }
    //   }
    // );

    // it.each([null, undefined])(
    //   "should parse correctly if packaging volume is %p" +
    //     " and bsff is created after MEP 2024.09.1 (in case of reexpedition)",
    //   v => {
    //     const zodBsdasri: ZodBsdasri = {
    //       type: "REEXPEDITION",
    //       isDraft: false,
    //       createdAt: new Date("2024-09-24T08:00:00"),
    //       packagings: [
    //         {
    //           weight: 1,
    //           volume: v,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect(parseBsdasri(zodBsdasri)).toBeDefined();
    //   }
    // );

    // it.each([null, undefined])(
    //   "should parse correctly if packaging volume is %p" +
    //     " and bsff is created after MEP 2024.09.1 (in case of groupement)",
    //   v => {
    //     const zodBsdasri: ZodBsdasri = {
    //       type: "GROUPEMENT",
    //       isDraft: false,
    //       createdAt: new Date("2024-09-24T08:00:00"),
    //       packagings: [
    //         {
    //           weight: 1,
    //           volume: v,
    //           numero: "1",
    //           emissionNumero: "1",
    //           type: "BOUTEILLE"
    //         }
    //       ]
    //     };
    //     expect(parseBsdasri(zodBsdasri)).toBeDefined();
    //   }
    // );
    //
    // it("should throw if weight value is negative", () => {
    //   const zodBsdasri: ZodBsdasri = {
    //     weightValue: -1
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(zodBsdasri);
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message: "Le poids doit être supérieur à 0"
    //       })
    //     ]);
    //   }
    // });
  });
});
