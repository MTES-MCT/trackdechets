import { z, ZodError } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  getWasteCodeSchema,
  wasteDescriptionSchema,
  wasteCodeBaleSchema,
  getOperationCodeSchema,
  weightValueSchema,
  weightIsEstimateSchema,
  volumeSchema,
  actorTypeSchema,
  actorOrgIdSchema,
  actorNameSchema,
  actorAddressSchema,
  actorCitySchema,
  actorPostalCodeSchema,
  actorCountryCodeSchema,
  transportModeSchema,
  transportRecepisseNumberSchema,
  booleanSchema,
  ttdNumberSchema,
  parcelNumbersSchema,
  getOperationModeSchema
} from "../schemas";
import { registryErrorMap } from "../../zodErrors";
import {
  refineWeightIsEstimate,
  refineIsDangerous,
  refineMunicipalities,
  refineRequiredOperationMode,
  refineOperationModeConsistency
} from "../refinement";
import { OperationMode } from "@td/prisma";

z.setErrorMap(registryErrorMap);

function checkErrorMessage(message: string, parse: () => any) {
  try {
    parse();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message
        })
      ])
    );
  }
}
describe("Schemas", () => {
  test("reasonSchema", () => {
    expect(reasonSchema.parse("MODIFIER")).toBe("MODIFIER");
    expect(reasonSchema.parse("EDIT")).toBe("MODIFIER");
    checkErrorMessage(
      'La valeur "INVALID" ne fait pas partie des valeurs autorisées. Veuillez vous référer à la documentation pour la liste des valeurs possibles',
      () => reasonSchema.parse("INVALID")
    );
  });

  test("publicIdSchema", () => {
    expect(publicIdSchema.parse("valid-id")).toBe("valid-id");
    expect(() => publicIdSchema.parse("")).toThrow();
    expect(() => publicIdSchema.parse("a".repeat(37))).toThrow();
    expect(() => publicIdSchema.parse("invalid id")).toThrow();
  });

  test("getWasteCodeSchema", () => {
    expect(() => getWasteCodeSchema().parse("17 02 01")).not.toThrow();
    expect(() => getWasteCodeSchema().parse("170201")).not.toThrow();
    expect(() => getWasteCodeSchema().parse("07 03 01*")).not.toThrow();
    expect(() => getWasteCodeSchema().parse("07 03 01 *")).not.toThrow();
    expect(() => getWasteCodeSchema().parse("070301*")).not.toThrow();
    expect(() => getWasteCodeSchema().parse("invalid")).toThrow();
    expect(() =>
      getWasteCodeSchema().nullish().parse("17 02 01")
    ).not.toThrow();
    expect(() => getWasteCodeSchema().nullish().parse("invalid")).toThrow();
    expect(() => getWasteCodeSchema().nullish().parse(null)).not.toThrow();
    expect(() => getWasteCodeSchema().nullish().parse(undefined)).not.toThrow();
    expect(() => getWasteCodeSchema().parse(null)).toThrow();
    expect(() => getWasteCodeSchema().parse(undefined)).toThrow();
  });

  test("wasteDescriptionSchema", () => {
    expect(wasteDescriptionSchema.parse("Valid description")).toBe(
      "Valid description"
    );
    expect(() => wasteDescriptionSchema.parse("a")).toThrow();
    expect(() => wasteDescriptionSchema.parse("a".repeat(301))).toThrow();
  });

  test("wasteCodeBaleSchema", () => {
    expect(wasteCodeBaleSchema.parse("A4070")).toBe("A4070");
    expect(wasteCodeBaleSchema.parse(undefined)).toBeUndefined();
    expect(() => wasteCodeBaleSchema.parse("A0000")).toThrow();
  });

  test("getOperationCodeSchema", () => {
    expect(getOperationCodeSchema().parse("D5")).toBe("D 5");
    expect(getOperationCodeSchema().parse("D15")).toBe("D 15");
    expect(getOperationCodeSchema().parse("D9F")).toBe("D 9 F");
    expect(() => getOperationCodeSchema().parse("invalid")).toThrow();
  });

  test("weightValueSchema", () => {
    expect(weightValueSchema.parse("500")).toBe(500);
    expect(weightValueSchema.parse("500,1")).toBe(500.1);
    expect(weightValueSchema.parse("500.1")).toBe(500.1);
    expect(() => weightValueSchema.parse("-1")).toThrow();
    expect(() => weightValueSchema.parse("10001")).toThrow();
    expect(() => weightValueSchema.parse("1.0001")).toThrow();
  });

  test("weightIsEstimateSchema", () => {
    expect(weightIsEstimateSchema.parse(true)).toBe(true);
    expect(weightIsEstimateSchema.parse("ESTIME")).toBe(true);
    expect(weightIsEstimateSchema.parse("REEL")).toBe(false);
    checkErrorMessage(
      'La valeur "INVALID" ne fait pas partie des valeurs autorisées. Veuillez saisir une des valeurs suivantes: "ESTIME", "REEL"',
      () => weightIsEstimateSchema.parse("INVALID")
    );
  });

  test("volumeSchema", () => {
    expect(volumeSchema.parse(500)).toBe(500);
    expect(volumeSchema.parse("500")).toBe(500);
    expect(volumeSchema.parse(undefined)).toBeUndefined();
    expect(() => volumeSchema.parse("-1")).toThrow();
    expect(() => volumeSchema.parse("10001")).toThrow();
  });

  test("booleanSchema", () => {
    expect(booleanSchema.parse("OUI")).toBe(true);
    expect(booleanSchema.parse("Oui")).toBe(true);
    expect(booleanSchema.parse("oui")).toBe(true);
    expect(booleanSchema.parse("NON")).toBe(false);
    expect(booleanSchema.parse("Non")).toBe(false);
    expect(booleanSchema.parse("non")).toBe(false);
    expect(booleanSchema.parse(false)).toBe(false);
    expect(booleanSchema.parse(true)).toBe(true);
    expect(() => booleanSchema.parse("foo")).toThrow();
    expect(() => booleanSchema.parse("")).toThrow();
    expect(() => booleanSchema.parse(undefined)).toThrow();
  });

  test("actorTypeSchema", () => {
    expect(actorTypeSchema.parse("ETABLISSEMENT_FR")).toBe("ETABLISSEMENT_FR");
    expect(() => actorTypeSchema.parse("INVALID")).toThrow();
  });

  test("actorOrgIdSchema", () => {
    expect(actorOrgIdSchema.parse("123")).toBe("123");
    expect(actorOrgIdSchema.parse(123)).toBe("123");
    expect(() => actorOrgIdSchema.parse("")).toThrow();
  });

  test("actorNameSchema", () => {
    expect(actorNameSchema.parse("Valid Name")).toBe("Valid Name");
    expect(() => actorNameSchema.parse("")).toThrow();
    expect(() => actorNameSchema.parse("a".repeat(251))).toThrow();
  });

  test("actorAddressSchema", () => {
    expect(actorAddressSchema.parse("Valid Address")).toBe("Valid Address");
    expect(() => actorAddressSchema.parse("")).toThrow();
    expect(() => actorAddressSchema.parse("a".repeat(251))).toThrow();
  });

  test("actorCitySchema", () => {
    expect(actorCitySchema.parse("Valid City")).toBe("Valid City");
    expect(() => actorCitySchema.parse("")).toThrow();
    expect(() => actorCitySchema.parse("a".repeat(46))).toThrow();
  });

  test("actorPostalCodeSchema", () => {
    expect(actorPostalCodeSchema.parse("12345")).toBe("12345"); // US ZIP code
    expect(actorPostalCodeSchema.parse("12345-6789")).toBe("12345-6789"); // US ZIP+4
    expect(actorPostalCodeSchema.parse("W1A 1AA")).toBe("W1A 1AA"); // UK
    expect(actorPostalCodeSchema.parse("K1A 0B1")).toBe("K1A 0B1"); // Canada
    expect(actorPostalCodeSchema.parse("75008")).toBe("75008"); // France
    expect(actorPostalCodeSchema.parse("100-0001")).toBe("100-0001"); // Japan
    expect(() => actorPostalCodeSchema.parse("_invalid_")).toThrow();
    expect(() => actorPostalCodeSchema.parse("-1234")).toThrow();
    expect(() => actorPostalCodeSchema.parse("1234567890ABC")).toThrow(); // Too long
  });

  test("actorCountryCodeSchema", () => {
    expect(actorCountryCodeSchema.parse("FR")).toBe("FR");
    expect(() => actorCountryCodeSchema.parse("invalid")).toThrow();
  });

  test("transportModeSchema", () => {
    expect(transportModeSchema.parse("ROUTE")).toBe("ROAD");
    expect(transportModeSchema.parse("AÉRIEN")).toBe("AIR");
    expect(transportModeSchema.parse("AERIEN")).toBe("AIR");
    expect(transportModeSchema.parse("aérien")).toBe("AIR");
    expect(() => transportModeSchema.parse("INVALID")).toThrow();
  });

  test("transportRecepisseNumberSchema", () => {
    expect(transportRecepisseNumberSchema.parse("12345")).toBe("12345");
    expect(() => transportRecepisseNumberSchema.parse("")).toThrow();
    expect(() =>
      transportRecepisseNumberSchema.parse("a".repeat(51))
    ).toThrow();
  });

  test("operationModeSchema", () => {
    expect(getOperationModeSchema().parse("Recyclage")).toBe("RECYCLAGE");
    expect(getOperationModeSchema().parse("Reutilisation")).toBe(
      "REUTILISATION"
    );
    expect(getOperationModeSchema().parse("Réutilisation")).toBe(
      "REUTILISATION"
    );
    expect(getOperationModeSchema().parse("réutilisation")).toBe(
      "REUTILISATION"
    );
    expect(getOperationModeSchema().parse("Valorisation énergétique")).toBe(
      "VALORISATION_ENERGETIQUE"
    );
    expect(() => getOperationModeSchema().parse("Valo énergétique")).toThrow();
    expect(getOperationModeSchema().parse(null)).toBe(null);
  });

  test("ttdNumberSchema", () => {
    expect(() => ttdNumberSchema.parse("A7E123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("A7I 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("A7I12123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("A7E 12 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("A7E 1234123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("A7E 1234 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR12123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR 12 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR 1234123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FR 1234 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ12123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ 12 123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ 1234123456")).not.toThrow();
    expect(() => ttdNumberSchema.parse("FRZ 1234 123456")).not.toThrow();

    expect(() => ttdNumberSchema.parse("ABCDEF")).toThrow();
    expect(() => ttdNumberSchema.parse("F123456")).toThrow();
    expect(() => ttdNumberSchema.parse("FR123")).toThrow();
    expect(() => ttdNumberSchema.parse("FRZA123456")).toThrow();
    expect(() => ttdNumberSchema.parse("12345678")).toThrow();
    expect(() => ttdNumberSchema.parse("AAAA 1234567890")).toThrow();
    expect(() => ttdNumberSchema.parse("A7E 2024 0631256")).toThrow();
  });

  test("parcelNumbersSchema", () => {
    expect(() => parcelNumbersSchema.parse("1-AA-1")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("1-A-1")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("1-AA-1")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("123-AA-1234")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("12-AA-12")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("123-AA-12")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("123-12-12")).not.toThrow();
    expect(() => parcelNumbersSchema.parse("123-A2-12")).not.toThrow();
    expect(() =>
      parcelNumbersSchema.parse("123-AA-1234,123-AA-1234")
    ).not.toThrow();
    expect(() => parcelNumbersSchema.parse("AAA")).toThrow();
    expect(() =>
      parcelNumbersSchema.parse("123-AA-1234;123 AA 1234")
    ).toThrow();
  });

  describe("Refinement Functions", () => {
    describe("refineWeightIsEstimate", () => {
      test("should allow estimated weight for operation codes other than R 1, D 10, D 5", () => {
        const testSchema = z
          .object({
            weightIsEstimate: z.boolean(),
            operationCode: z.string()
          })
          .superRefine(refineWeightIsEstimate);

        // Should not throw for other operation codes
        expect(() =>
          testSchema.parse({
            weightIsEstimate: true,
            operationCode: "R 2"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            weightIsEstimate: true,
            operationCode: "D 1"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            weightIsEstimate: true,
            operationCode: "R 13"
          })
        ).not.toThrow();

        // Should always allow non-estimated weight
        expect(() =>
          testSchema.parse({
            weightIsEstimate: false,
            operationCode: "R 1"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            weightIsEstimate: false,
            operationCode: "D 10"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            weightIsEstimate: false,
            operationCode: "D 5"
          })
        ).not.toThrow();
      });

      test("should reject estimated weight for operation codes R 1, D 10, D 5", () => {
        const testSchema = z
          .object({
            weightIsEstimate: z.boolean(),
            operationCode: z.string()
          })
          .superRefine(refineWeightIsEstimate);

        const testCases = ["R 1", "D 10", "D 5"];

        testCases.forEach(operationCode => {
          try {
            testSchema.parse({
              weightIsEstimate: true,
              operationCode
            });
            fail(
              `Expected validation to fail for operation code ${operationCode}`
            );
          } catch (error) {
            expect(error).toBeInstanceOf(ZodError);
            const zodError = error as ZodError;
            expect(zodError.issues).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message:
                    "Pour les codes de traitement R 1, D 10 et D 5, le poids ne peut pas être estimé",
                  path: ["weightIsEstimate"]
                })
              ])
            );
          }
        });
      });
    });

    describe("refineIsDangerous", () => {
      test("should reject non-dangerous waste when POP is true", () => {
        const testSchema = z
          .object({
            wasteIsDangerous: z.boolean().nullish(),
            wastePop: z.boolean(),
            wasteCode: z.string().nullish()
          })
          .superRefine(refineIsDangerous);

        try {
          testSchema.parse({
            wasteIsDangerous: false,
            wastePop: true,
            wasteCode: "17 02 01"
          });
          fail(
            "Expected validation to fail when POP is true but waste is marked non-dangerous"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message:
                  "Le déchet contient des POP ou a un code déchet avec étoile, il ne peut pas être indiqué comme non dangereux",
                path: ["wasteIsDangerous"]
              })
            ])
          );
        }
      });

      test("should reject non-dangerous waste when waste code contains asterisk", () => {
        const testSchema = z
          .object({
            wasteIsDangerous: z.boolean().nullish(),
            wastePop: z.boolean(),
            wasteCode: z.string().nullish()
          })
          .superRefine(refineIsDangerous);

        try {
          testSchema.parse({
            wasteIsDangerous: false,
            wastePop: false,
            wasteCode: "07 03 01*"
          });
          fail(
            "Expected validation to fail when waste code has asterisk but waste is marked non-dangerous"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message:
                  "Le déchet contient des POP ou a un code déchet avec étoile, il ne peut pas être indiqué comme non dangereux",
                path: ["wasteIsDangerous"]
              })
            ])
          );
        }
      });

      test("should allow dangerous waste to be marked as dangerous", () => {
        const testSchema = z
          .object({
            wasteIsDangerous: z.boolean().nullish(),
            wastePop: z.boolean(),
            wasteCode: z.string().nullish()
          })
          .superRefine(refineIsDangerous);

        // Should not throw for consistent dangerous marking
        expect(() =>
          testSchema.parse({
            wasteIsDangerous: true,
            wastePop: true,
            wasteCode: "07 03 01*"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            wasteIsDangerous: true,
            wastePop: false,
            wasteCode: "07 03 01*"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            wasteIsDangerous: true,
            wastePop: true,
            wasteCode: "17 02 01"
          })
        ).not.toThrow();
      });

      test("should skip validation when wasteIsDangerous is null or undefined", () => {
        const testSchema = z
          .object({
            wasteIsDangerous: z.boolean().nullish(),
            wastePop: z.boolean(),
            wasteCode: z.string().nullish()
          })
          .superRefine(refineIsDangerous);

        // Should not throw when wasteIsDangerous is null or undefined
        expect(() =>
          testSchema.parse({
            wasteIsDangerous: null,
            wastePop: true,
            wasteCode: "07 03 01*"
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            wasteIsDangerous: undefined,
            wastePop: true,
            wasteCode: "07 03 01*"
          })
        ).not.toThrow();
      });
    });

    describe("refineMunicipalities", () => {
      test("should require INSEE codes when company type is COMMUNES", () => {
        const testSchema = z
          .object({
            initialEmitterCompanyType: z
              .enum([
                "ETABLISSEMENT_FR",
                "ENTREPRISE_UE",
                "ENTREPRISE_HORS_UE",
                "ASSOCIATION",
                "PERSONNE_PHYSIQUE",
                "COMMUNES"
              ])
              .nullish(),
            initialEmitterMunicipalitiesInseeCodes: z.array(z.string())
          })
          .superRefine(refineMunicipalities);

        try {
          testSchema.parse({
            initialEmitterCompanyType: "COMMUNES",
            initialEmitterMunicipalitiesInseeCodes: []
          });
          fail(
            "Expected validation to fail when COMMUNES type has no INSEE codes"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message:
                  "Le ou les codes INSEE des communes doivent être saisi",
                path: ["initialEmitterMunicipalitiesInseeCodes"]
              })
            ])
          );
        }
      });

      test("should allow empty INSEE codes for non-COMMUNES company types", () => {
        const testSchema = z
          .object({
            initialEmitterCompanyType: z
              .enum([
                "ETABLISSEMENT_FR",
                "ENTREPRISE_UE",
                "ENTREPRISE_HORS_UE",
                "ASSOCIATION",
                "PERSONNE_PHYSIQUE",
                "COMMUNES"
              ])
              .nullish(),
            initialEmitterMunicipalitiesInseeCodes: z.array(z.string())
          })
          .superRefine(refineMunicipalities);

        const nonCommunesTypes = [
          "ETABLISSEMENT_FR",
          "ENTREPRISE_UE",
          "ENTREPRISE_HORS_UE",
          "ASSOCIATION",
          "PERSONNE_PHYSIQUE"
        ];

        nonCommunesTypes.forEach(companyType => {
          expect(() =>
            testSchema.parse({
              initialEmitterCompanyType: companyType as any,
              initialEmitterMunicipalitiesInseeCodes: []
            })
          ).not.toThrow();
        });

        // Should also allow null company type
        expect(() =>
          testSchema.parse({
            initialEmitterCompanyType: null,
            initialEmitterMunicipalitiesInseeCodes: []
          })
        ).not.toThrow();
      });

      test("should allow COMMUNES with INSEE codes", () => {
        const testSchema = z
          .object({
            initialEmitterCompanyType: z
              .enum([
                "ETABLISSEMENT_FR",
                "ENTREPRISE_UE",
                "ENTREPRISE_HORS_UE",
                "ASSOCIATION",
                "PERSONNE_PHYSIQUE",
                "COMMUNES"
              ])
              .nullish(),
            initialEmitterMunicipalitiesInseeCodes: z.array(z.string())
          })
          .superRefine(refineMunicipalities);

        expect(() =>
          testSchema.parse({
            initialEmitterCompanyType: "COMMUNES",
            initialEmitterMunicipalitiesInseeCodes: ["75001", "75002"]
          })
        ).not.toThrow();
      });
    });

    describe("refineRequiredOperationMode", () => {
      test("should require operation mode for final operation codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineRequiredOperationMode);

        // Test some final operation codes
        const finalOperationCodes = ["R 1", "R 2", "R 3", "D 1", "D 2", "D 3"];

        finalOperationCodes.forEach(operationCode => {
          try {
            testSchema.parse({
              operationCode,
              operationMode: null
            });
            fail(
              `Expected validation to fail for final operation code ${operationCode} without operation mode`
            );
          } catch (error) {
            expect(error).toBeInstanceOf(ZodError);
            const zodError = error as ZodError;
            expect(zodError.issues).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message:
                    "Le mode de traitement est requis lorsqu'un code de traitement final a été renseigné",
                  path: ["operationMode"]
                })
              ])
            );
          }
        });
      });

      test("should not require operation mode for non-final operation codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineRequiredOperationMode);

        // Test non-final operation codes
        const nonFinalOperationCodes = [
          "R 12",
          "R 13",
          "D 9",
          "D 13",
          "D 14",
          "D 15"
        ];

        nonFinalOperationCodes.forEach(operationCode => {
          expect(() =>
            testSchema.parse({
              operationCode,
              operationMode: null
            })
          ).not.toThrow();
        });
      });

      test("should allow operation mode for final operation codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineRequiredOperationMode);

        expect(() =>
          testSchema.parse({
            operationCode: "R 1",
            operationMode: OperationMode.RECYCLAGE
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            operationCode: "D 1",
            operationMode: OperationMode.ELIMINATION
          })
        ).not.toThrow();
      });
    });

    describe("refineOperationModeConsistency", () => {
      test("should require ELIMINATION mode for D codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineOperationModeConsistency);

        // Test D codes that should require ELIMINATION mode
        const dCodes = ["D 1", "D 2", "D 3", "D 4", "D 5"];

        dCodes.forEach(operationCode => {
          try {
            testSchema.parse({
              operationCode,
              operationMode: OperationMode.RECYCLAGE
            });
            fail(
              `Expected validation to fail for D code ${operationCode} with non-ELIMINATION mode`
            );
          } catch (error) {
            expect(error).toBeInstanceOf(ZodError);
            const zodError = error as ZodError;
            expect(zodError.issues).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message:
                    "Le mode de traitement doit obligatoirement être Élimination lorsque le code de traitement commence par D",
                  path: ["operationMode"]
                })
              ])
            );
          }
        });
      });

      test("should allow ELIMINATION mode for D codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineOperationModeConsistency);

        expect(() =>
          testSchema.parse({
            operationCode: "D 1",
            operationMode: OperationMode.ELIMINATION
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            operationCode: "D 5",
            operationMode: OperationMode.ELIMINATION
          })
        ).not.toThrow();
      });

      test("should allow various modes for R codes", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineOperationModeConsistency);

        // Test valid combinations based on CODES_AND_EXPECTED_OPERATION_MODES
        expect(() =>
          testSchema.parse({
            operationCode: "R 1",
            operationMode: OperationMode.VALORISATION_ENERGETIQUE
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            operationCode: "R 2",
            operationMode: OperationMode.REUTILISATION
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            operationCode: "R 2",
            operationMode: OperationMode.RECYCLAGE
          })
        ).not.toThrow();

        expect(() =>
          testSchema.parse({
            operationCode: "R 4",
            operationMode: OperationMode.RECYCLAGE
          })
        ).not.toThrow();
      });

      test("should reject incompatible operation mode and code combinations", () => {
        const testSchema = z
          .object({
            operationCode: z.string(),
            operationMode: z.nativeEnum(OperationMode).nullish()
          })
          .superRefine(refineOperationModeConsistency);

        // Test invalid combinations
        try {
          testSchema.parse({
            operationCode: "R 1", // Only allows VALORISATION_ENERGETIQUE
            operationMode: OperationMode.RECYCLAGE
          });
          fail("Expected validation to fail for R 1 with RECYCLAGE mode");
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message:
                  "Le mode de traitement n'est pas compatible avec le code de traitement choisi"
              })
            ])
          );
        }

        try {
          testSchema.parse({
            operationCode: "R 4", // Only allows RECYCLAGE
            operationMode: OperationMode.VALORISATION_ENERGETIQUE
          });
          fail(
            "Expected validation to fail for R 4 with VALORISATION_ENERGETIQUE mode"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          const zodError = error as ZodError;
          expect(zodError.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message:
                  "Le mode de traitement n'est pas compatible avec le code de traitement choisi"
              })
            ])
          );
        }
      });
    });
  });
});
