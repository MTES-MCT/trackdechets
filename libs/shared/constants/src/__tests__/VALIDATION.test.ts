import {
  isSiretExemptFromRegistryDateLimit,
  TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_SIRETS,
  TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_END_DATE
} from "../VALIDATION";

describe("isSiretExemptFromRegistryDateLimit", () => {
  const exemptSiret = TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_SIRETS[0];
  const beforeEnd = new Date(
    TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_END_DATE.getTime() - 1000
  );
  const afterEnd = new Date(
    TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_END_DATE.getTime() + 1000
  );

  test("returns true for an exempted siret before the end date", () => {
    expect(isSiretExemptFromRegistryDateLimit(exemptSiret, beforeEnd)).toBe(
      true
    );
  });

  test("returns false for an exempted siret after the end date", () => {
    expect(isSiretExemptFromRegistryDateLimit(exemptSiret, afterEnd)).toBe(
      false
    );
  });

  test("returns false for a siret that is not in the exemption list", () => {
    expect(
      isSiretExemptFromRegistryDateLimit("11111111100011", beforeEnd)
    ).toBe(false);
  });
});
