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
  operationModeSchema
} from "../schemas";
import { registryErrorMap } from "../../zodErrors";

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
    expect(() => getWasteCodeSchema().parse("invalid")).toThrow();
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
    expect(() => getOperationCodeSchema().parse("invalid")).toThrow();
  });

  test("weightValueSchema", () => {
    expect(weightValueSchema.parse("500")).toBe(500);
    expect(weightValueSchema.parse("500,1")).toBe(500.1);
    expect(weightValueSchema.parse("500.1")).toBe(500.1);
    expect(() => weightValueSchema.parse("-1")).toThrow();
    expect(() => weightValueSchema.parse("1001")).toThrow();
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
    expect(() => volumeSchema.parse("1001")).toThrow();
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
    expect(() => actorNameSchema.parse("a".repeat(151))).toThrow();
  });

  test("actorAddressSchema", () => {
    expect(actorAddressSchema.parse("Valid Address")).toBe("Valid Address");
    expect(() => actorAddressSchema.parse("")).toThrow();
    expect(() => actorAddressSchema.parse("a".repeat(151))).toThrow();
  });

  test("actorCitySchema", () => {
    expect(actorCitySchema.parse("Valid City")).toBe("Valid City");
    expect(() => actorCitySchema.parse("")).toThrow();
    expect(() => actorCitySchema.parse("a".repeat(46))).toThrow();
  });

  test("actorPostalCodeSchema", () => {
    expect(actorPostalCodeSchema.parse("12345")).toBe("12345");
    expect(() => actorPostalCodeSchema.parse("invalid")).toThrow();
  });

  test("actorCountryCodeSchema", () => {
    expect(actorCountryCodeSchema.parse("FR")).toBe("FR");
    expect(() => actorCountryCodeSchema.parse("invalid")).toThrow();
  });

  test("transportModeSchema", () => {
    expect(transportModeSchema.parse("ROUTE")).toBe("ROAD");
    expect(transportModeSchema.parse("AÉRIEN")).toBe("AIR");
    expect(() => transportModeSchema.parse("INVALID")).toThrow();
  });

  test("transportRecepisseNumberSchema", () => {
    expect(transportRecepisseNumberSchema.parse("12345")).toBe("12345");
    expect(() => transportRecepisseNumberSchema.parse("1234")).toThrow();
    expect(() =>
      transportRecepisseNumberSchema.parse("a".repeat(51))
    ).toThrow();
  });

  test("operationModeSchema", () => {
    expect(operationModeSchema.parse("Recyclage")).toBe("RECYCLAGE");
    expect(operationModeSchema.parse("Reutilisation")).toBe("REUTILISATION");
    expect(operationModeSchema.parse("Réutilisation")).toBe("REUTILISATION");
    expect(operationModeSchema.parse("réutilisation")).toBe("REUTILISATION");
    expect(operationModeSchema.parse("Valorisation énergétique")).toBe(
      "VALORISATION_ENERGETIQUE"
    );
    expect(() => operationModeSchema.parse("Valo énergétique")).toThrow();
    expect(operationModeSchema.parse(null)).toBe(null);
  });
});
