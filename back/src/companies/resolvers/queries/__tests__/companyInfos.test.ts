import { UserInputError } from "apollo-server-express";
import { getCompanyInfos } from "../companyInfos";
import { ErrorCode } from "../../../../common/errors";

const searchCompanyMock = jest.fn();
const vatMock = jest.fn();

jest.mock("../../../sirene/searchCompany", () =>
  jest.fn((...args) => searchCompanyMock(...args))
);

jest.mock("../../../vat", () => ({
  searchVat: jest.fn((...args) => vatMock(...args))
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

describe("companyInfos with SIRET", () => {
  beforeEach(() => {
    searchCompanyMock.mockReset();
    companyMock.mockReset();
    installationMock.mockReset();
  });

  it("should throw NOT_FOUND error if the siret is not in sirene database", async () => {
    searchCompanyMock.mockResolvedValueOnce({ siret: "" });
    expect.assertions(1);
    try {
      await getCompanyInfos("85001946400014");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should merge info from SIRENE, TD and s3ic", async () => {
    searchCompanyMock.mockResolvedValueOnce({
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

    expect(company).toStrictEqual({
      siret: "85001946400013",
      name: "Code en stock",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr",
      isRegistered: true,
      ecoOrganismeAgreements: [],
      companyTypes: undefined,
      installation: {
        codeS3ic: "0055.14316"
      }
    });
  });

  it("should return SIRET search only if not registered", async () => {
    searchCompanyMock.mockResolvedValueOnce({
      siret: "85001946400013",
      name: "Code en stock"
    });
    companyMock.mockResolvedValueOnce(null);
    const company = await getCompanyInfos("85001946400014");

    expect(company).toStrictEqual({
      siret: "85001946400013",
      name: "Code en stock",
      isRegistered: false,
      companyTypes: [],
      ecoOrganismeAgreements: [],
      installation: undefined
    });
  });
});

describe("companyInfos search with a VAT number", () => {
  beforeEach(() => {
    vatMock.mockReset();
    companyMock.mockReset();
    installationMock.mockReset();
  });

  it("should throw NOT_FOUND error if the VAT is not found by VIES API", async () => {
    vatMock.mockRejectedValueOnce(new UserInputError("not found"));
    expect.assertions(1);
    try {
      await getCompanyInfos("TT85001946400014");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should merge info from VAT and TD without S3ic", async () => {
    vatMock.mockResolvedValueOnce({
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT"
    });
    companyMock.mockResolvedValueOnce({
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr"
    });

    companyMock.mockResolvedValueOnce(null);

    const company = await getCompanyInfos("IT09301420155");

    expect(company).toStrictEqual({
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr",
      isRegistered: true,
      ecoOrganismeAgreements: [],
      companyTypes: undefined,
      installation: undefined
    });
  });

  it("should return VAT search only if not registered", async () => {
    vatMock.mockResolvedValueOnce({
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT"
    });
    companyMock.mockResolvedValueOnce(null);
    const company = await getCompanyInfos("IT09301420155");

    expect(company).toStrictEqual({
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT",
      isRegistered: false,
      companyTypes: [],
      ecoOrganismeAgreements: [],
      installation: undefined
    });
  });
});
