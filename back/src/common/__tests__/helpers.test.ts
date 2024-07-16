import { dateToXMonthAtHHMM } from "../helpers";

describe("dateToXMonthAtHHMM", () => {
  test("should return date formatted as 'X mois YYYY à HH:mm", () => {
    // When
    const result = dateToXMonthAtHHMM(new Date("2024-07-08 17:49:35"));

    // Then
    expect(result).toBe("8 juillet 2024 à 17:49");
  });
});
