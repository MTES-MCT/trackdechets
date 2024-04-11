import { bsddQuantities } from "../quantities";

describe("quantities", () => {
  describe("bsddQuantities", () => {
    describe("Null use-cases", () => {
      test("BSDD hasn't been received yet > should not return any value", () => {
        // Given
        const bsdd = {};

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toBeNull();
      });

      test("BSDD has no wasteAcceptationStatus > should not return any value", () => {
        // Given
        const bsdd = { quantityReceived: 10 };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toBeNull();
      });

      test("BSDD has no quantityReceived > should not return any value", () => {
        // Given
        const bsdd = { wasteAcceptationStatus: "ACCEPTED" };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toBeNull();
      });
    });

    describe("wasteAcceptationStatus = ACCEPTED", () => {
      test("should return quantityAccepted = quantityReceived and quantityRefused = 0", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15,
          quantityRefused: 0
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15,
          quantityAccepted: 15,
          quantityRefused: 0
        });
      });

      test("[legacy] should return quantityAccepted = quantityReceived and quantityRefused = 0", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15,
          quantityAccepted: 15,
          quantityRefused: 0
        });
      });

      test("[edge-case] quantityReceived & quantityRefused are inconsistent > should return result based on quantityReceived", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15,
          quantityRefused: 3
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 15,
          quantityAccepted: 15,
          quantityRefused: 0
        });
      });
    });

    describe("wasteAcceptationStatus = REFUSED", () => {
      test("should return quantityAccepted = 0 and quantityRefused = quantityReceived", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15,
          quantityRefused: 15
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15,
          quantityAccepted: 0,
          quantityRefused: 15
        });
      });

      test("[legacy] should return quantityAccepted = 0 and quantityRefused = quantityReceived", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15,
          quantityAccepted: 0,
          quantityRefused: 15
        });
      });

      test("[edge-case] quantityReceived & quantityRefused are inconsistent > should return result based on quantityReceived", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15,
          quantityRefused: 3
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: 15,
          quantityAccepted: 0,
          quantityRefused: 15
        });
      });
    });

    describe("wasteAcceptationStatus = PARTIALLY_REFUSED", () => {
      test("should evaluate quantityAccepted", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15,
          quantityRefused: 7
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15,
          quantityAccepted: 8,
          quantityRefused: 7
        });
      });

      test("decimals > should evaluate quantityAccepted", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15.56,
          quantityRefused: 7.987
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15.56,
          quantityAccepted: 7.573,
          quantityRefused: 7.987
        });
      });

      test("[legacy] quantityRefused is null > quantityAccepted = quantityReceived and quantityRefused stays null", () => {
        // Given
        const bsdd = {
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15
        };

        // When
        const quantities = bsddQuantities(bsdd);

        // Then
        expect(quantities).toMatchObject({
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: 15,
          quantityAccepted: 15,
          quantityRefused: null
        });
      });
    });
  });
});
