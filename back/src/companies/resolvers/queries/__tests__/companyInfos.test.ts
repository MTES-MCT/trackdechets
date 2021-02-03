import { getCompanyInfos } from "../companyInfos";
import { ErrorCode } from "../../../../common/errors";

const sireneMock = jest.fn();

jest.mock("../../../sirene", () => ({
  searchCompany: jest.fn((...args) => sireneMock(...args))
}));

const companyMock = jest.fn();
jest.mock("../../../../prisma", () => ({
  company: { findUnique: jest.fn((...args) => companyMock(...args)) }
}));

const installationMock = jest.fn();
jest.mock("../../../database", () => ({
  getInstallation: jest.fn((...args) => installationMock(...args)),
  convertUrls: v => v
}));

describe("companyInfos", () => {
  beforeEach(() => {
    sireneMock.mockReset();
    companyMock.mockReset();
    installationMock.mockReset();
  });

  it("should throw NOT_FOUND error if the siret is not in sirene database", async () => {
    sireneMock.mockResolvedValueOnce({ siret: "" });
    expect.assertions(1);
    try {
      await getCompanyInfos("85001946400014");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
  it("should merge info from sirene, TD and s3ic", async () => {
    sireneMock.mockResolvedValueOnce({
      siret: "85001946400013",
      name: "Code en stock"
    });
    companyMock.mockResolvedValueOnce({
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr"
    });
    installationMock.mockResolvedValueOnce({
      codeS3ic: "0055.14316"
    });

    const company = await getCompanyInfos("85001946400014");

    expect(company).toEqual({
      siret: "85001946400013",
      name: "Code en stock",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr",
      isRegistered: true,
      ecoOrganismeAgreements: [],
      installation: {
        codeS3ic: "0055.14316"
      }
    });
  });
});
