import { TEST_COMPANY_PREFIX, isSiret } from "@td/constants";
import { generateRandomTestSiret } from "../createTestCompany";

describe("generateRandomTestSiret", () => {
  it("should generate a random siret with 14 characters, and the first 6 should be the test prefix", async () => {
    // Given

    // When
    const randomSiret = await generateRandomTestSiret();

    // Then
    expect(randomSiret.length).toEqual(14);
    expect(randomSiret.startsWith(TEST_COMPANY_PREFIX)).toBeTruthy();
  });

  it("should generate a valid siret", async () => {
    // Given

    // When
    const randomSiret = await generateRandomTestSiret();

    // Then
    expect(isSiret(randomSiret)).toBeTruthy();
  });
});
