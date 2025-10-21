import { resetDatabase } from "../../../../integration-tests/helper";
import {
  UserWithCompany,
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { ZodBsdasri } from "../schema";
import { parseBsdasri, parseBsdasriAsync } from "..";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData,
  readyToTakeOverData,
  readyToReceiveData,
  readyToProcessData
} from "../../__tests__/factories";
import { prismaToZodBsdasri } from "../helpers";
import { BsdasriValidationContext } from "../types";
import { ZodOperationEnum } from "../../../bsda/validation/schema";
import { OperationMode } from "@prisma/client";

jest.mock("../../../companies/search");

describe("validation > parseBsdasri", () => {
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
        ...initialData(emitter.company),
        ...readyToPublishData(destination),
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

  describe("validation rules", () => {
    it("before emission", async () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri
      };

      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "EMISSION" })
      ).toBeDefined();
    });

    it("before transport", async () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri
      };

      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });

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

    it("should throw when SIRETs are invalid", () => {
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
              message: "Émetteur : foo1 n'est pas un SIRET valide"
            }),

            expect.objectContaining({
              message: "Destination : foo2 n'est pas un SIRET valide"
            }),

            expect.objectContaining({
              message: "Transporteur : foo3 n'est pas un SIRET valide"
            })
          ])
        );
      }
    });

    it("should parse correctly when SIRETs are valid", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        emitterCompanySiret: siretify(),
        destinationCompanySiret: siretify(),
        transporterCompanySiret: siretify()
      };
      expect(parseBsdasri(zodBsdasri)).toBeDefined();
    });

    it("when transporter vatNumber is FR", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanyVatNumber: "FR35552049447",
        transporterCompanySiret: null
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
          })
        ]);
      }
    });

    it("when transporter is not registered in Trackdéchets", async () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanySiret: "85001946400021"
      };

      const parseFn = () =>
        parseBsdasriAsync(zodBsdasri, { currentSignatureType: "TRANSPORT" });

      await expect(parseFn).rejects.toThrow(
        "Transporteur : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    it("when foreign transporter is not registered in Trackdéchets", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanyVatNumber: company.vatNumber
      };

      const parseFn = () =>
        parseBsdasriAsync(zodBsdasri, { currentSignatureType: "TRANSPORT" });

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when transporter is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });

      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanySiret: company.siret
      };
      const parseFn = () =>
        parseBsdasriAsync(zodBsdasri, { currentSignatureType: "TRANSPORT" });

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when foreign transporter is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      };
      const parseFn = () =>
        parseBsdasriAsync(zodBsdasri, { currentSignatureType: "TRANSPORT" });

      await expect(parseFn).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when there is foreign vat number and transporter siret is null", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterCompanyVatNumber: foreignTransporter.company.vatNumber,
        transporterCompanySiret: null
      };

      expect(parseBsdasri(zodBsdasri, {})).toBeDefined();
    });

    it("when destination siret is not valid", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        destinationCompanySiret: "1"
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: "Destination : 1 n'est pas un SIRET valide"
            })
          ])
        );
      }
    });

    it("when destination is not registered in Trackdéchets", async () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        destinationCompanySiret: "85001946400021"
      };

      expect.assertions(1);
      try {
        await parseBsdasriAsync(zodBsdasri, {
          currentSignatureType: "TRANSPORT"
        });
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message:
                "Destination : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
            })
          ])
        );
      }

      // expect.assertions(1);
      // try {
      //   parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      // } catch (e) {
      //   expect(e.errors).toEqual(
      //     expect.arrayContaining([
      //       expect.objectContaining({
      //         message:
      //           "Destination : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      //       })
      //     ])
      //   );
      // }
    });

    it("when destination is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });

      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        destinationCompanySiret: company.siret
      };

      expect.assertions(1);
      try {
        await parseBsdasriAsync(zodBsdasri, {
          currentSignatureType: "TRANSPORT"
        });
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message:
                `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite` +
                " sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc" +
                " pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil" +
                " de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
            })
          ])
        );
      }
    });

    it("emitter transports own waste > allowed if exemption", async () => {
      const zodBsdasri = {
        ...bsdasri,
        transporterCompanySiret: bsdasri.emitterCompanySiret,
        transporterRecepisseIsExempted: true
      };

      const parsed = await parseBsdasriAsync(zodBsdasri, {
        currentSignatureType: "TRANSPORT"
      });

      expect(parsed).toBeDefined();
    });

    it("emitter transports own waste > not allowed if no exemption", async () => {
      const zodBsdasri = {
        ...bsdasri,
        transporterCompanySiret: emitter.company.siret,
        transporterRecepisseIsExempted: false
      };

      expect.assertions(1);
      try {
        await parseBsdasriAsync(zodBsdasri, {
          currentSignatureType: "TRANSPORT"
        });
      } catch (e) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message:
                `Le transporteur saisi sur le bordereau (SIRET: ${emitter.company.siret}) n'est pas inscrit sur Trackdéchets` +
                ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
                ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
                ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
            })
          ])
        );
      }
    });

    it("there is a foreign transporter and recepisse fields are null", () => {
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

    it("when transporter is french and exempted of recepisse", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterRecepisseIsExempted: true,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };

      expect(parseBsdasri(zodBsdasri, {})).toBeDefined();
    });

    it("transporter plate is required if transport mode is ROAD", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: []
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "L'immatriculation du transporteur est un champ requis."
          })
        ]);
      }
    });

    it("transporter recepisse is not required if transport mode is not ROAD", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "AIR",
        transporterRecepisseDepartment: "",
        transporterRecepisseNumber: "",
        transporterRecepisseValidityLimit: null
      };
      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });

    it("transporter recepisse is required if transport mode is ROAD", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterRecepisseDepartment: "",
        transporterRecepisseNumber: "",
        transporterRecepisseValidityLimit: null
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "La date de validité du récépissé du transporteur est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    it("transporter plate is not required if transport mode is not ROAD", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "AIR",
        transporterTransportPlates: []
      };
      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });

    it("should work if transport mode is ROAD & plates are defined", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["AA12BV"]
      };

      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    });

    it("should throw if a transporter has more than 2 plates", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["AA12BV", "YT54RT", "KJ98YU"]
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Un maximum de 2 plaques d'immatriculation est accepté"
          })
        ]);
      }
    });

    it("should throw if transporter plate number is too short", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["AA"]
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    it("should throw if transporter plate number is too long", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["AB-KL-ML-PO-IO-7-PO"]
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    it("should throw if transporter plate number is made of whitespace", () => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["      "]
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le numéro de plaque fourni est incorrect"
          })
        ]);
      }
    });

    it.each(["AB", "abcdefghjklmopnqr", "     "])(
      "should be valid if plates number is invalid (%p) on bsdasri created before v20250201",
      plate => {
        const zodBsdasri: ZodBsdasri = {
          ...bsdasri,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: [plate],
          createdAt: new Date("2025-01-10T00:00:00Z")
        };

        expect(
          parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
        ).toBeDefined();
      }
    );

    // it("when operation mode is not compatible with operation code", async () => {
    //   const dasri: ZodBsdasri = {
    //     ...bsdasri,
    //     transporterWasteWeightValue: 11,
    //     ...readyToReceiveData(),
    //     ...readyToProcessData,
    //     destinationOperationCode: "R1" as ZodOperationEnum,
    //     destinationOperationMode: "RECYCLAGE",
    //     destinationReceptionWasteWeightValue: 10
    //   };
    //   expect.assertions(1);
    //   try {
    //     parseBsdasri(dasri, {
    //       currentSignatureType: "OPERATION"
    //     });
    //   } catch (e) {
    //     expect(e.errors).toEqual([
    //       expect.objectContaining({
    //         message:
    //           "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
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

  test.each([
    ["D9F", OperationMode.ELIMINATION],
    ["D10", OperationMode.ELIMINATION],
    ["R1", OperationMode.VALORISATION_ENERGETIQUE],
    ["D13", undefined],
    ["R12", undefined]
  ])(
    "should work if operation code & mode are compatible (code: %p, mode: %p)",
    async (code, mode) => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        destinationOperationCode: code,
        destinationOperationMode: mode,
        destinationOperationDate: new Date(),
        destinationReceptionWasteWeightValue: 10
      };

      expect(
        parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
      ).toBeDefined();
    }
  );

  test("should work if operation code & mode are missing", async () => {
    const zodBsdasri: ZodBsdasri = {
      ...bsdasri,
      destinationOperationCode: undefined,
      destinationOperationMode: undefined,
      destinationOperationDate: new Date(),
      destinationReceptionWasteWeightValue: 10
    };

    expect(
      parseBsdasri(zodBsdasri, { currentSignatureType: "TRANSPORT" })
    ).toBeDefined();
  });

  test.each([
    ["D9F", OperationMode.VALORISATION_ENERGETIQUE], // Correct mode is ELIMINATION
    ["D10", OperationMode.VALORISATION_ENERGETIQUE], // Correct mode is ELIMINATION
    ["R1", OperationMode.ELIMINATION], //  Correct mode is VALORISATION_ENERGETIQUE
    ["D13", OperationMode.VALORISATION_ENERGETIQUE], //  No mode is expected
    ["R12", OperationMode.VALORISATION_ENERGETIQUE] // R12 has no associated mode
  ])(
    "should work if operation code & mode are compatible (code: %p, mode: %p)",
    async (code, mode) => {
      const zodBsdasri: ZodBsdasri = {
        ...bsdasri,
        ...readyToReceiveData(),
        ...readyToProcessData,
        destinationOperationCode: code,
        destinationOperationMode: mode,
        destinationOperationDate: new Date(),
        destinationReceptionWasteWeightValue: 10
      };

      expect.assertions(1);
      try {
        parseBsdasri(zodBsdasri, { currentSignatureType: "OPERATION" });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
          })
        ]);
      }
    }
  );

  test.each(["D10", "R1"])(
    "if operation code has associated operation modes but none is specified (code: %p)",
    async code => {
      const dasri: ZodBsdasri = {
        ...bsdasri,
        transporterWasteWeightValue: 11,
        ...readyToReceiveData(),
        ...readyToProcessData,
        destinationOperationCode: code as ZodOperationEnum,
        destinationOperationMode: undefined,
        destinationReceptionWasteWeightValue: 10
      };
      expect.assertions(1);
      try {
        parseBsdasri(dasri as ZodBsdasri, {
          currentSignatureType: "OPERATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Vous devez préciser un mode de traitement"
          })
        ]);
      }
    }
  );
});
