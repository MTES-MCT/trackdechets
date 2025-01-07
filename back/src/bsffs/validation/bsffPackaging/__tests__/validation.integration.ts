import { resetDatabase } from "../../../../../integration-tests/helper";
import { searchCompany } from "../../../../companies/search";
import { ZodBsffPackaging } from "../schema";
import { parseBsffPackaging, parseBsffPackagingAsync } from "..";
import { OperationMode } from "@prisma/client";
import { ZodOperationEnum } from "../../bsff/schema";
import {
  UserWithCompany,
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { OPERATION } from "../../../constants";
import { CompanySearchResult } from "@td/codegen-back";

jest.mock("../../../../companies/search");

describe("validation > parseBsffPackaging", () => {
  let nextDestination: UserWithCompany;

  afterEach(resetDatabase);

  beforeAll(async () => {
    nextDestination = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["WASTEPROCESSOR"]
    });
  });

  describe("static validation rules", () => {
    // On teste ici les règles de validation statiques
    // définies par le schéma Zod "brut"

    it("should throw when e-mail is invalid", () => {
      const invalidZodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanyMail: "foo"
      };

      expect.assertions(1);
      try {
        parseBsffPackaging(invalidZodBsffPackaging);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "E-mail destination ultérieure invalide"
          })
        ]);
      }
    });

    it("should parse correctly when e-mail is valid", () => {
      const validZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanyMail: "john.snow@trackdechets.fr"
      };
      const parsed = parseBsffPackaging(validZodBsffPackaging);
      expect(parsed).toBeDefined();
    });

    it("should throw in case of refus partiel", () => {
      const invalidZodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        acceptationStatus: "PARTIALLY_REFUSED"
      };

      expect.assertions(1);
      try {
        parseBsffPackaging(invalidZodBsffPackaging);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le refus partiel n'est pas autorisé dans le cas d'un BSFF"
          })
        ]);
      }
    });
  });

  describe("refined rules", () => {
    // On teste ici les règles de validation définies par des méthodes
    // .superRefine et qui vérifient la cohérence des champs entre eux.

    it.each([
      ["R5", "REUTILISATION"],
      ["R13", undefined]
    ])(
      "should parse correctly if operation code & mode are compatible (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const zodBsff: ZodBsffPackaging = {
          numero: "123",
          operationCode: code as ZodOperationEnum,
          operationMode: mode,
          ...(code === "R13"
            ? {
                operationNextDestinationCompanyName: "Destination finale",
                operationNextDestinationCompanySiret:
                  nextDestination.company.siret,
                operationNextDestinationCompanyAddress:
                  "Adresse destination finale",
                operationNextDestinationCompanyContact:
                  "Contact destination finale",
                operationNextDestinationCompanyPhone: "00 00 00 00 00",
                operationNextDestinationCompanyMail: "john.snow@trackdechets.fr"
              }
            : {})
        };

        const parsed = parseBsffPackaging(zodBsff);
        expect(parsed).toBeDefined();
      }
    );

    test.each([
      ["R5", "VALORISATION_ENERGETIQUE"], // Correct modes are REUTILISATION or RECYCLAGE
      ["R13", "VALORISATION_ENERGETIQUE"] // R 13 has no associated mode,
    ])(
      "should fail if operation mode is not compatible with operation code (code: %p, mode: %p)",
      (code, mode: OperationMode) => {
        const zodBsff: ZodBsffPackaging = {
          numero: "123",
          operationCode: code as ZodOperationEnum,
          operationMode: mode,
          ...(code === "R13"
            ? {
                operationNextDestinationCompanyName: "Destination finale",
                operationNextDestinationCompanySiret:
                  nextDestination.company.siret,
                operationNextDestinationCompanyAddress:
                  "Adresse destination finale",
                operationNextDestinationCompanyContact:
                  "Contact destination finale",
                operationNextDestinationCompanyPhone: "00 00 00 00 00",
                operationNextDestinationCompanyMail: "john.snow@trackdechets.fr"
              }
            : {})
        };

        expect.assertions(1);
        try {
          parseBsffPackaging(zodBsff);
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

    it(
      "should parse correctly if operation code has" +
        " associated operation modes but none is specified",
      () => {
        const zodBsff: ZodBsffPackaging = {
          numero: "1",
          operationCode: "R5" as ZodOperationEnum,
          operationMode: undefined
        };

        const parsed = parseBsffPackaging(zodBsff);
        expect(parsed).toBeDefined();
      }
    );

    it("should not be possible to set next destination when operation code is final", () => {
      const zodBsff: ZodBsffPackaging = {
        numero: "123",
        operationCode: "R1",
        acceptationWeight: 1,
        operationNextDestinationCompanyName: "Destination finale"
      };

      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "L'opération de traitement renseignée ne permet pas de destination ultérieure"
          })
        ]);
      }
    });

    it("should ne be possible to set `noTraceability=true` when operation code is final", () => {
      const zodBsff: ZodBsffPackaging = {
        numero: "123",
        operationCode: "R1",
        acceptationWeight: 1,
        operationNoTraceability: true
      };

      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsff);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
          })
        ]);
      }
    });
  });

  describe("required fields rules", () => {
    test("required fields should be present at acceptation signature", async () => {
      const zodBsffPackaging: ZodBsffPackaging = { numero: "123" };
      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsffPackaging, {
          currentSignatureType: "ACCEPTATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ acceptationDate est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ acceptationStatus est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ acceptationWeight est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ acceptationWasteDescription est obligatoire."
          })
        ]);
      }
    });

    it(
      "should parse correctly at acceptation signature when" +
        " all required fields are present",
      async () => {
        const zodBsffPackaging: ZodBsffPackaging = {
          numero: "123",
          acceptationDate: new Date(),
          acceptationStatus: "ACCEPTED",
          acceptationWeight: 1,
          acceptationWasteCode: "14 06 01*",
          acceptationWasteDescription: "fluide frigo"
        };
        expect(
          parseBsffPackaging(zodBsffPackaging, {
            currentSignatureType: "ACCEPTATION"
          })
        ).toBeDefined();
      }
    );

    test("`acceptationRefusalReason` is required when `acceptationStatus` is REFUSED", () => {
      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        acceptationDate: new Date(),
        acceptationStatus: "REFUSED",
        acceptationWeight: 0,
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide frigo"
      };
      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsffPackaging, {
          currentSignatureType: "ACCEPTATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ acceptationRefusalReason est obligatoire."
          })
        ]);
      }
    });

    test("`acceptationWeight is 0 when packaging is refused", () => {
      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        acceptationDate: new Date(),
        acceptationStatus: "REFUSED",
        acceptationRefusalReason: "parce que",
        acceptationWeight: 1,
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide frigo"
      };
      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsffPackaging, {
          currentSignatureType: "ACCEPTATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "le poids à l'acceptation doit être égal à 0 lorsque le contenant est refusé"
          })
        ]);
      }
    });

    test("`acceptationWeight > 0 when packaging is accepted", () => {
      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        acceptationDate: new Date(),
        acceptationStatus: "ACCEPTED",
        acceptationWeight: 0,
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide frigo"
      };
      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsffPackaging, {
          currentSignatureType: "ACCEPTATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "le poids à l'acceptation doit être supérieur à 0 lorsque le contenant est accepté"
          })
        ]);
      }
    });

    test("required fields should be present at operation signature", async () => {
      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        acceptationDate: new Date(),
        acceptationStatus: "ACCEPTED",
        acceptationWeight: 1,
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide frigo",
        acceptationSignatureDate: new Date(),
        acceptationSignatureAuthor: "Michel"
      };
      expect.assertions(1);
      try {
        parseBsffPackaging(zodBsffPackaging, {
          currentSignatureType: "OPERATION"
        });
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: "Le champ operationDate est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ operationCode est obligatoire."
          }),
          expect.objectContaining({
            message: "Le champ operationDescription est obligatoire."
          })
        ]);
      }
    });

    it(
      "should parse correctly at operation signature" +
        " when all required fields are present",
      async () => {
        const zodBsffPackaging: ZodBsffPackaging = {
          numero: "123",
          acceptationDate: new Date(),
          acceptationStatus: "ACCEPTED",
          acceptationWeight: 1,
          acceptationWasteCode: "14 06 01*",
          acceptationWasteDescription: "fluide frigo",
          acceptationSignatureDate: new Date(),
          acceptationSignatureAuthor: "Michel",
          operationDate: new Date(),
          operationCode: "R1",
          operationMode: "VALORISATION_ENERGETIQUE",
          operationDescription: "traitement"
        };
        expect(
          parseBsffPackaging(zodBsffPackaging, {
            currentSignatureType: "OPERATION"
          })
        ).toBeDefined();
      }
    );

    test(
      "nextDestination info is required at operation signature" +
        " when operation code is not final and noTraceability is false",
      async () => {
        const zodBsffPackaging: ZodBsffPackaging = {
          numero: "123",
          acceptationDate: new Date(),
          acceptationStatus: "ACCEPTED",
          acceptationWeight: 1,
          acceptationWasteCode: "14 06 01*",
          acceptationWasteDescription: "fluide frigo",
          acceptationSignatureDate: new Date(),
          acceptationSignatureAuthor: "Michel",
          operationDate: new Date(),
          operationCode: OPERATION.D13.code,
          operationMode: undefined,
          operationNoTraceability: false,
          operationDescription: "traitement"
        };
        expect.assertions(1);
        try {
          parseBsffPackaging(zodBsffPackaging, {
            currentSignatureType: "OPERATION"
          });
        } catch (e) {
          expect(e.errors).toEqual([
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyName est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanySiret est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyVatNumber est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyAddress est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyContact est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyPhone est obligatoire."
            }),
            expect.objectContaining({
              message:
                "Le champ operationNextDestinationCompanyMail est obligatoire."
            })
          ]);
        }
      }
    );
  });

  describe("company profiles rules", () => {
    test("next destination should be registered in Trackdéchets", async () => {
      const randomSiret = siretify();
      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanySiret: randomSiret
      };
      expect.assertions(1);
      try {
        await parseBsffPackagingAsync(zodBsffPackaging);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message: `Destination : L'établissement avec le SIRET ${randomSiret} n'est pas inscrit sur Trackdéchets`
          })
        ]);
      }
    });

    test("next destination should be registered with good profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });

      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanySiret: company.siret
      };
      expect.assertions(1);
      try {
        await parseBsffPackagingAsync(zodBsffPackaging);
      } catch (e) {
        expect(e.errors).toEqual([
          expect.objectContaining({
            message:
              "L'installation de destination ou d’entreposage ou de reconditionnement avec le" +
              ` SIRET "${company.siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation` +
              " de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être" +
              " visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation" +
              " pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets" +
              " dans Mes établissements"
          })
        ]);
      }
    });
  });

  describe("sirenify transformers", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const nextDestination = await userWithCompanyFactory("MEMBER");

      function searchResult(companyName: string) {
        return {
          name: companyName,
          address: `Adresse ${companyName}`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [nextDestination.company.siret!]: searchResult("destination ultérieure")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanySiret: nextDestination.company.siret,
        operationNextDestinationCompanyName: "N'importe",
        operationNextDestinationCompanyAddress: "Nawak"
      };

      const parsed = await parseBsffPackagingAsync(zodBsffPackaging);

      expect(parsed.operationNextDestinationCompanyName).toEqual(
        searchResults[nextDestination.company.siret!].name
      );
      expect(parsed.operationNextDestinationCompanyAddress).toEqual(
        searchResults[nextDestination.company.siret!].address
      );
    });

    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
      const nextDestination = await userWithCompanyFactory("MEMBER");

      function searchResult(companyName: string) {
        return {
          name: companyName,
          address: `Adresse ${companyName}`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [nextDestination.company.siret!]: searchResult("destination ultérieure")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const zodBsffPackaging: ZodBsffPackaging = {
        numero: "123",
        operationNextDestinationCompanySiret: nextDestination.company.siret
      };

      const parsed = await parseBsffPackagingAsync(zodBsffPackaging);

      expect(parsed.operationNextDestinationCompanyName).toEqual(
        searchResults[nextDestination.company.siret!].name
      );
      expect(parsed.operationNextDestinationCompanyAddress).toEqual(
        searchResults[nextDestination.company.siret!].address
      );
    });
  });
});
