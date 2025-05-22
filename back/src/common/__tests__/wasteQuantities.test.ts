import Decimal from "decimal.js";
import { wasteQuantities } from "../wasteQuantities";

describe("wasteQuantities", () => {
  describe("Null use-cases", () => {
    test("bsd hasn't been received yet > should not return any value", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: null,
        quantityReceived: null,
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });

    test("bsd has no wasteAcceptationStatus > should not return any value", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: null,
        quantityReceived: new Decimal(10),
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });

    test("bsd has no quantityReceived > should not return any value", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: null,
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });
  });

  describe("wasteAcceptationStatus = ACCEPTED", () => {
    test("should return quantityAccepted = quantityReceived and quantityRefused = 0", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: new Decimal(15),
        quantityRefused: new Decimal(0)
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities?.quantityAccepted?.toNumber()).toEqual(15);
      expect(quantities?.quantityRefused?.toNumber()).toEqual(0);
    });

    test("[legacy] should return null", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: new Decimal(15),
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });
  });

  describe("wasteAcceptationStatus = REFUSED", () => {
    test("should return quantityAccepted = 0 and quantityRefused = quantityReceived", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "REFUSED",
        quantityReceived: new Decimal(15),
        quantityRefused: new Decimal(15)
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities?.quantityAccepted?.toNumber()).toEqual(0);
      expect(quantities?.quantityRefused?.toNumber()).toEqual(15);
    });

    test("[legacy] should return null", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "REFUSED",
        quantityReceived: new Decimal(15),
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });
  });

  describe("wasteAcceptationStatus = PARTIALLY_REFUSED", () => {
    test("should evaluate quantityAccepted", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: new Decimal(15),
        quantityRefused: new Decimal(7)
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities?.quantityAccepted?.toNumber()).toEqual(8);
      expect(quantities?.quantityRefused?.toNumber()).toEqual(7);
    });

    test("decimals > should evaluate quantityAccepted", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: new Decimal(15.56),
        quantityRefused: new Decimal(7.987)
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities?.quantityAccepted?.toNumber()).toEqual(7.573);
      expect(quantities?.quantityRefused?.toNumber()).toEqual(7.987);
    });

    test("[legacy] should return null", () => {
      // Given
      const bsdd = {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: new Decimal(15),
        quantityRefused: null
      };

      // When
      const quantities = wasteQuantities(bsdd);

      // Then
      expect(quantities).toBeNull();
    });
  });
});
