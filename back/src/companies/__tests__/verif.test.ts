import { checkIsCompatible } from "../verif";
import { getInstallationRubriques } from "../helper";

jest.mock("../helper", () => ({
  getInstallationRubriques: jest.fn()
}));

describe("checkIsCompatible", () => {
  it("should return false if the waste is dangerous and no rubrique is compatible", async () => {
    const rubriques = [{ wasteType: "NOT_DANGEROUS" }];
    (getInstallationRubriques as jest.Mock).mockResolvedValueOnce(rubriques);

    const isCompatible = await checkIsCompatible(
      { codeS3ic: "0056.0987" },
      "*78 98 78"
    );

    expect(isCompatible).toBe(false);
  });

  it("should return true if the waste is not dangerous", async () => {
    const isCompatible = await checkIsCompatible(
      { codeS3ic: "0056.0987" },
      "78 98 78"
    );

    expect(isCompatible).toBe(true);
  });

  it("should return true if the waste is dangerous and there is a rubrique compatible", async () => {
    const rubriques = [{ wasteType: "DANGEROUS" }];
    (getInstallationRubriques as jest.Mock).mockResolvedValueOnce(rubriques);

    const isCompatible = await checkIsCompatible(
      { codeS3ic: "0056.0987" },
      "*78 98 78"
    );

    expect(isCompatible).toBe(true);
  });
});
