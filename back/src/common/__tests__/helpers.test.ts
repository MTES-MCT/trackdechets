import { dateToXMonthAtHHMM, getSafeReturnTo } from "../helpers";

describe("dateToXMonthAtHHMM", () => {
  test("should return date formatted as 'X mois YYYY à HH:mm", () => {
    // When
    const result = dateToXMonthAtHHMM(new Date("2024-07-08 17:49:35"));

    // Then
    expect(result).toBe("8 juillet 2024 à 17:49");
  });
});

describe("getSafeReturnTo", () => {
  test("should return the safe returnTo URL if it is valid", () => {
    const result = getSafeReturnTo("/dashboard", "https://example.com");
    expect(result).toBe("/dashboard");
  });

  test("should return '/' if the returnTo URL is not valid", () => {
    const result = getSafeReturnTo(
      "https://malicious.com",
      "https://example.com"
    );
    expect(result).toBe("/");
  });

  test("should return '/' if the returnTo URL is not valid", () => {
    const result = getSafeReturnTo("@google.fr", "https://example.com");
    expect(result).toBe("/");
  });
});
