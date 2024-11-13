import { z, ZodError } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  wasteCodeSchema,
  wasteDescriptionSchema,
  wasteCodeBaleSchema,
  operationCodeSchema,
  weightValueSchema,
  weightIsEstimateSchema,
  volumeSchema,
  getActorTypeSchema,
  getActorOrgIdSchema,
  getActorNameSchema,
  getActorAddressSchema,
  getActorCitySchema,
  getActorPostalCodeSchema,
  getActorCountryCodeSchema,
  transportModeSchema,
  transportReceiptNumberSchema
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

  test("wasteCodeSchema", () => {
    expect(() => wasteCodeSchema.parse("17 02 01")).not.toThrow();
    expect(() => wasteCodeSchema.parse("invalid")).toThrow();
  });

  test("wasteDescriptionSchema", () => {
    expect(wasteDescriptionSchema.parse("Valid description")).toBe(
      "Valid description"
    );
    expect(() => wasteDescriptionSchema.parse("a")).toThrow();
    expect(() => wasteDescriptionSchema.parse("a".repeat(201))).toThrow();
  });

  test("wasteCodeBaleSchema", () => {
    expect(wasteCodeBaleSchema.parse("A4070")).toBe("A4070");
    expect(wasteCodeBaleSchema.parse(undefined)).toBeUndefined();
    expect(() => wasteCodeBaleSchema.parse("A0000")).toThrow();
  });

  test("operationCodeSchema", () => {
    expect(operationCodeSchema.parse("D5")).toBe("D 5");
    expect(() => operationCodeSchema.parse("invalid")).toThrow();
  });

  test("weightValueSchema", () => {
    expect(weightValueSchema.parse(500)).toBe(500);
    expect(() => weightValueSchema.parse(-1)).toThrow();
    expect(() => weightValueSchema.parse(1001)).toThrow();
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
    expect(volumeSchema.parse("500")).toBe(500);
    expect(volumeSchema.parse(undefined)).toBeUndefined();
    expect(() => volumeSchema.parse("-1")).toThrow();
    expect(() => volumeSchema.parse("1001")).toThrow();
  });

  test("getActorTypeSchema", () => {
    const actorTypeSchema = getActorTypeSchema("test");
    expect(actorTypeSchema.parse("ENTREPRISE_FR")).toBe("ENTREPRISE_FR");
    expect(() => actorTypeSchema.parse("INVALID")).toThrow();
  });

  test("getActorOrgIdSchema", () => {
    const actorOrgIdSchema = getActorOrgIdSchema("test");
    expect(actorOrgIdSchema.parse("123")).toBe("123");
    expect(actorOrgIdSchema.parse(123)).toBe("123");
    expect(() => actorOrgIdSchema.parse("")).toThrow();
  });

  test("getActorNameSchema", () => {
    const actorNameSchema = getActorNameSchema("test");
    expect(actorNameSchema.parse("Valid Name")).toBe("Valid Name");
    expect(() => actorNameSchema.parse("a")).toThrow();
    expect(() => actorNameSchema.parse("a".repeat(151))).toThrow();
  });

  test("getActorAddressSchema", () => {
    const actorAddressSchema = getActorAddressSchema("test");
    expect(actorAddressSchema.parse("Valid Address")).toBe("Valid Address");
    expect(() => actorAddressSchema.parse("a")).toThrow();
    expect(() => actorAddressSchema.parse("a".repeat(151))).toThrow();
  });

  test("getActorCitySchema", () => {
    const actorCitySchema = getActorCitySchema("test");
    expect(actorCitySchema.parse("Valid City")).toBe("Valid City");
    expect(() => actorCitySchema.parse("a")).toThrow();
    expect(() => actorCitySchema.parse("a".repeat(46))).toThrow();
  });

  test("getActorPostalCodeSchema", () => {
    const actorPostalCodeSchema = getActorPostalCodeSchema("test");
    expect(actorPostalCodeSchema.parse("12345")).toBe("12345");
    expect(() => actorPostalCodeSchema.parse("invalid")).toThrow();
  });

  test("getActorCountryCodeSchema", () => {
    const actorCountryCodeSchema = getActorCountryCodeSchema("test");
    expect(actorCountryCodeSchema.parse("FR")).toBe("FR");
    expect(() => actorCountryCodeSchema.parse("invalid")).toThrow();
  });

  test("transportModeSchema", () => {
    expect(transportModeSchema.parse("ROUTE")).toBe("ROAD");
    expect(transportModeSchema.parse("AÉRIEN")).toBe("AIR");
    expect(() => transportModeSchema.parse("INVALID")).toThrow();
  });

  test("transportReceiptNumberSchema", () => {
    expect(transportReceiptNumberSchema.parse("12345")).toBe("12345");
    expect(() => transportReceiptNumberSchema.parse("1234")).toThrow();
    expect(() => transportReceiptNumberSchema.parse("a".repeat(51))).toThrow();
  });
});
