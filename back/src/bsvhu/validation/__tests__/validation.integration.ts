import { Company, OperationMode } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { CompanySearchResult } from "../../../companies/types";
import { searchCompany } from "../../../companies/search";

import { bsvhuFactory } from "../../__tests__/factories.vhu";
import { ZodBsvhu } from "../schema";
import { BsvhuValidationContext } from "../types";
import { prismaToZodBsvhu } from "../helpers";
import { parseBsvhu, parseBsvhuAsync } from "..";
import { ZodError } from "zod";

const searchResult = (companyName: string) => {
  return {
    name: companyName,
    address: `Adresse ${companyName}`,
    statutDiffusionEtablissement: "O"
  } as CompanySearchResult;
};

jest.mock("../../../companies/search");

describe("BSVHU validation", () => {
  afterAll(resetDatabase);

  let bsvhu: ZodBsvhu;
  let context: BsvhuValidationContext;
  let foreignTransporter: Company;
  let transporterCompany: Company;
  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });
    foreignTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });

    const prismaBsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret: destinationCompany.siret
      }
    });
    bsvhu = prismaToZodBsvhu(prismaBsvhu);
    context = {
      currentSignatureType: undefined
    };
  });

  describe("BSVHU should be valid", () => {
    test("when there is a foreign transporter vatNumber and transporter siret is null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });
    test("when transporter is french and exemption of recepisse is true", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterRecepisseIsExempted: true,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });
  });

  describe("BSVHU should not be valid", () => {
    test("when emitter siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        emitterCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Émetteur : 1 n'est pas un numéro de SIRET valide"
          })
        ]);
      }
    });

    test("when transporter siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Transporteur : 1 n'est pas un numéro de SIRET valide"
          })
        ]);
      }
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanySiret: "85001946400021"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Transporteur : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "ESA15022510"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le transporteur avec le n°de TVA ESA15022510 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets` +
              " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
              " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets` +
              " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
              " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when transporter vatNumber is FR", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterCompanyVatNumber: "FR35552049447"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
          }),
          expect.objectContaining({
            message:
              "Le transporteur avec le n°de TVA FR35552049447 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when destination siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Destination : 1 n'est pas un numéro de SIRET valide"
          }),
          expect.objectContaining({
            message:
              "Destination : L'établissement avec le SIRET 1 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: "85001946400021"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Destination : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `L'installation de destination avec le SIRET \"${company.siret}\" n'est pas inscrite` +
              " sur Trackdéchets en tant qu'installation de traitement de VHU. Cette installation ne peut donc pas" +
              " être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when transporter is french but recepisse fields are missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporterRecepisseIsExempted: false,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro de récépissé du transporteur est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "La date de validité du récépissé du transporteur est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    test("when destination agrement number is missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationAgrementNumber: null
      };

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "EMISSION"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le N° d'agrément du destinataire est un champ requis."
          })
        ]);
      }
    });

    describe("Emitter transports own waste", () => {
      it("allowed if exemption", async () => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporterCompanySiret: bsvhu.emitterCompanySiret,
          transporterRecepisseIsExempted: true
        };

        expect.assertions(1);

        const parsed = await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
        expect(parsed).toBeDefined();
      });

      it("NOT allowed if no exemption", async () => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporterCompanySiret: bsvhu.emitterCompanySiret,
          transporterRecepisseIsExempted: false
        };

        expect.assertions(1);

        try {
          await parseBsvhuAsync(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: `Le transporteur saisi sur le bordereau (SIRET: ${bsvhu.emitterCompanySiret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
            })
          ]);
        }
      });
    });
  });

  describe("Operation modes", () => {
    test("should work if operation code & mode are compatible", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "R 4",
        destinationOperationMode: "REUTILISATION",
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };

      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).toBeDefined();
    });

    test("should work if operation code & mode are compatible", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "D 1",
        destinationOperationMode: "ELIMINATION",
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };

      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).not.toBeUndefined();
    });

    test("should not work if operation code & mode are missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: undefined,
        destinationOperationMode: undefined,
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "OPERATION"
        });
      } catch (err) {
        expect((err as ZodError).issues.length).toBeTruthy();
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "L'opération réalisée par le destinataire est un champ requis."
          })
        ]);
      }
    });

    test.each([
      ["R 4", OperationMode.ELIMINATION], // Correct mode is  REUTILISATION | RECYCLAGE
      ["R 12", OperationMode.REUTILISATION] // R12 has no associated mode
    ])(
      "should not be valid if operation mode is not compatible with operation code (mode: %p, code: %p)",
      async (code, mode) => {
        const data: ZodBsvhu = {
          ...bsvhu,
          destinationOperationCode: code,
          destinationOperationMode: mode,
          destinationReceptionWeight: 10,
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationOperationDate: new Date()
        };
        expect.assertions(2);

        try {
          parseBsvhu(data, {
            ...context,
            currentSignatureType: "OPERATION"
          });
        } catch (err) {
          expect((err as ZodError).issues.length).toBeTruthy();
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
            })
          ]);
        }
      }
    );

    test("should fail when operation code has associated operation modes but none is specified", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "R 1",
        destinationOperationMode: undefined,
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };
      expect.assertions(2);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "OPERATION"
        });
      } catch (err) {
        expect((err as ZodError).issues.length).toBeTruthy();
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Vous devez préciser un mode de traitement"
          })
        ]);
      }
    });
  });

  describe("sirenify", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const searchResults = {
        [bsvhu.emitterCompanySiret!]: searchResult("émetteur"),
        [bsvhu.transporterCompanySiret!]: searchResult("transporteur"),
        [bsvhu.destinationCompanySiret!]: searchResult("destinataire")
      };
      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const sirenified = await parseBsvhuAsync(bsvhu, {
        ...context
      });

      expect(sirenified.emitterCompanyName).toEqual(
        searchResults[bsvhu.emitterCompanySiret!].name
      );
      expect(sirenified.emitterCompanyAddress).toEqual(
        searchResults[bsvhu.emitterCompanySiret!].address
      );
      expect(sirenified.transporterCompanyName).toEqual(
        searchResults[bsvhu.transporterCompanySiret!].name
      );
      expect(sirenified.transporterCompanyAddress).toEqual(
        searchResults[bsvhu.transporterCompanySiret!].address
      );
      expect(sirenified.destinationCompanyName).toEqual(
        searchResults[bsvhu.destinationCompanySiret!].name
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        searchResults[bsvhu.destinationCompanySiret!].address
      );
    });
  });

  describe("BSVHU Recipify Module", () => {
    it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
      const receipt = await transporterReceiptFactory({
        company: transporterCompany
      });
      const recipified = await parseBsvhuAsync(bsvhu, {
        ...context
      });
      expect(recipified).toEqual(
        expect.objectContaining({
          transporterRecepisseNumber: receipt.receiptNumber,
          transporterRecepisseDepartment: receipt.department,
          transporterRecepisseValidityLimit: receipt.validityLimit
        })
      );
    });

    it("recipify should correctly process input with isExempted true and return completedInput without transporter recepisse", async () => {
      const recipified = await parseBsvhuAsync(
        {
          ...bsvhu,
          transporterRecepisseIsExempted: true
        },
        {
          ...context
        }
      );
      expect(recipified).toEqual(
        expect.objectContaining({
          transporterRecepisseNumber: null,
          transporterRecepisseDepartment: null,
          transporterRecepisseValidityLimit: null
        })
      );
    });
  });
});
