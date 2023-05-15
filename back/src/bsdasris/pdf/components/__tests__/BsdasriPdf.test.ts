import { buildAddress } from "../BsdasriPdf";

describe("buildAddress", () => {
  test("should build address", () => {
    // Given
    const pickupSite = {
      address: "4 boulevard de la paix",
      postalCode: "44100",
      city: "Nantes"
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix 44100 Nantes");
  });

  test("should not take nulls or undefineds into account", () => {
    // Given
    const pickupSite = {
      address: "4 boulevard de la paix",
      postalCode: null,
      city: undefined
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix");
  });

  test("should deal with empty strings", () => {
    // Given
    const pickupSite = {
      address: "  ",
      postalCode: " ",
      city: "     "
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("");
  });

  test("if no param, should return an empty string", () => {
    // Given

    // When
    const result = buildAddress([]);

    // Then
    expect(result).toBe("");
  });

  test("should not repeat data that's already in address", () => {
    // Given
    const pickupSite = {
      address: "4 boulevard de la paix 44100 Nantes",
      postalCode: "44100",
      city: "Nantes"
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix 44100 Nantes");
  });

  test("if no address, should return other params", () => {
    // Given
    const pickupSite = {
      address: "",
      postalCode: "44100",
      city: "Nantes"
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("44100 Nantes");
  });

  test("if no postalCode, should return other params", () => {
    // Given
    const pickupSite = {
      address: "4 boulevard de la paix",
      postalCode: "",
      city: "Nantes"
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix Nantes");
  });

  test("if no city, should return other params", () => {
    // Given
    const pickupSite = {
      address: "4 boulevard de la paix",
      postalCode: "44100",
      city: ""
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix 44100");
  });

  test("should trim", () => {
    // Given
    const pickupSite = {
      address: "   4 boulevard de la paix",
      postalCode: "44100",
      city: "Nantes   "
    };

    // When
    const result = buildAddress([
      pickupSite.address,
      pickupSite.postalCode,
      pickupSite.city
    ]);

    // Then
    expect(result).toBe("4 boulevard de la paix 44100 Nantes");
  });
});
