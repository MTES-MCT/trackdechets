import { getFrenchPublicHolidays, getNextWorkday } from "../dateUtils";

describe("dateUtils", () => {
  describe("getFrenchPublicHolidays", () => {
    it("should return correct 2025 public holidays", () => {
      // When
      const publicHolidays = getFrenchPublicHolidays(2025);

      // Then
      expect(publicHolidays.sort()).toMatchObject(
        [
          "2025-01-01", // Jour de l'an
          "2025-04-21", // Lundi de Pâques
          "2025-05-01", // Fête du travail
          "2025-05-08", // Victoire 1945
          "2025-05-29", // Ascension
          "2025-06-09", // Lundi de Pentecôte
          "2025-07-14", // Fête nationale / révolution
          "2025-08-15", // Assomption
          "2025-11-01", // Toussaint
          "2025-11-11", // Armistice 1918
          "2025-12-25" // Jour de Noël
        ].sort()
      );
    });

    it("should return correct 2026 public holidays", () => {
      // When
      const publicHolidays = getFrenchPublicHolidays(2026);

      // Then
      expect(publicHolidays.sort()).toMatchObject(
        [
          "2026-01-01", // Jour de l'an
          "2026-04-06", // Lundi de Pâques
          "2026-05-01", // Fête du travail
          "2026-05-08", // Victoire 1945
          "2026-05-14", // Ascension
          "2026-05-25", // Lundi de Pentecôte
          "2026-07-14", // Fête nationale / révolution
          "2026-08-15", // Assomption
          "2026-11-01", // Toussaint
          "2026-11-11", // Armistice 1918
          "2026-12-25" // Jour de Noël
        ].sort()
      );
    });

    it("should return correct 2027 public holidays", () => {
      // When
      const publicHolidays = getFrenchPublicHolidays(2027);

      // Then
      expect(publicHolidays.sort()).toMatchObject(
        [
          "2027-01-01", // Jour de l'an
          "2027-03-29", // Lundi de Pâques
          "2027-05-01", // Fête du travail
          "2027-05-08", // Victoire 1945
          "2027-05-06", // Ascension
          "2027-05-17", // Lundi de Pentecôte
          "2027-07-14", // Fête nationale / révolution
          "2027-08-15", // Assomption
          "2027-11-01", // Toussaint
          "2027-11-11", // Armistice 1918
          "2027-12-25" // Jour de Noël
        ].sort()
      );
    });
  });

  describe("getNextWorkday", () => {
    it("if friday > should return next monday", () => {
      // Given
      const date = new Date("2025-03-21");

      // When
      const nextWorkDay = getNextWorkday(date);

      // Then
      expect(nextWorkDay.toISOString().split("T")[0]).toBe("2025-03-24");
    });

    it("if saturday > should return next monday", () => {
      // Given
      const date = new Date("2025-04-26");

      // When
      const nextWorkDay = getNextWorkday(date);

      // Then
      expect(nextWorkDay.toISOString().split("T")[0]).toBe("2025-04-28");
    });

    it("if sunday > should return next tuesday", () => {
      // Given
      const date = new Date("2025-02-02");

      // When
      const nextWorkDay = getNextWorkday(date);

      // Then
      expect(nextWorkDay.toISOString().split("T")[0]).toBe("2025-02-03");
    });

    it("if sunday BUT monday is public holiday > should return next tuesday", () => {
      // Given
      const date = new Date("2025-06-08"); // Le Lundi suivant est Lundi de Pentecôte

      // When
      const nextWorkDay = getNextWorkday(date);

      // Then
      expect(nextWorkDay.toISOString().split("T")[0]).toBe("2025-06-10");
    });
  });
});
