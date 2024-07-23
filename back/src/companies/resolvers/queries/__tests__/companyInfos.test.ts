import { getCompanyInfos } from "../companyInfos";
import { ErrorCode, UserInputError } from "../../../../common/errors";
import { siretify } from "../../../../__tests__/factories";
import { WasteVehiclesType } from "@td/codegen-ui";

const searchCompanyMock = jest.fn();
const vatMock = jest.fn();

jest.mock("../../../sirene/searchCompany", () =>
  jest.fn((...args) => searchCompanyMock(...args))
);

jest.mock("../../../vat", () => ({
  searchVat: jest.fn((...args) => vatMock(...args))
}));

const companyMock = jest.fn();
jest.mock("@td/prisma", () => ({
  prisma: {
    company: { findUnique: jest.fn((...args) => companyMock(...args)) },
    anonymousCompany: { findUnique: jest.fn(() => null) }
  }
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
    searchCompanyMock.mockRejectedValueOnce(
      new UserInputError("Siret not found")
    );
    expect.assertions(1);
    try {
      await getCompanyInfos("85001946400014");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should merge info from SIRENE, TD and s3ic", async () => {
    const siret = siretify(1);
    searchCompanyMock.mockResolvedValueOnce({
      siret,
      orgId: siret,
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

    const company = await getCompanyInfos(siret);

    expect(company).toStrictEqual({
      siret,
      orgId: siret,
      name: "Code en stock",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr",
      isRegistered: true,
      ecoOrganismeAgreements: [],
      companyTypes: [],
      wasteProcessorTypes: [],
      collectorTypes: [],
      wasteVehiclesType: [],
      installation: {
        codeS3ic: "0055.14316"
      },
      address: undefined,
      allowBsdasriTakeOverWithoutSignature: undefined,
      brokerReceipt: undefined,
      codeCommune: undefined,
      codePaysEtrangerEtablissement: undefined,
      contact: undefined,
      etatAdministratif: undefined,
      libelleNaf: undefined,
      naf: undefined,
      statutDiffusionEtablissement: undefined,
      traderReceipt: undefined,
      transporterReceipt: undefined,
      vatNumber: undefined,
      vhuAgrementBroyeur: undefined,
      vhuAgrementDemolisseur: undefined
    });
  });

  it("should return SIRET search only if not registered", async () => {
    const siret = siretify(1);

    searchCompanyMock.mockResolvedValueOnce({
      siret,
      orgId: siret,
      name: "Code en stock"
    });
    companyMock.mockResolvedValueOnce(null);
    const company = await getCompanyInfos(siret);

    expect(company).toStrictEqual({
      siret,
      orgId: siret,
      name: "Code en stock",
      isRegistered: false,
      companyTypes: [],
      wasteProcessorTypes: [],
      collectorTypes: [],
      wasteVehiclesType: [],
      ecoOrganismeAgreements: [],
      installation: undefined,
      address: undefined,
      allowBsdasriTakeOverWithoutSignature: undefined,
      brokerReceipt: undefined,
      codeCommune: undefined,
      codePaysEtrangerEtablissement: undefined,
      contact: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      etatAdministratif: undefined,
      libelleNaf: undefined,
      naf: undefined,
      statutDiffusionEtablissement: undefined,
      traderReceipt: undefined,
      transporterReceipt: undefined,
      vatNumber: undefined,
      vhuAgrementBroyeur: undefined,
      vhuAgrementDemolisseur: undefined,
      website: undefined
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

  it("should return from TD when search for an existing VAT number", async () => {
    vatMock.mockResolvedValueOnce({
      vatNumber: "IT09301420155",
      name: "---", // mock VIES returning hidden company name
      address: "---",
      codePaysEtrangerEtablissement: "IT",
      statutDiffusionEtablissement: "O",
      etatAdministratif: "A"
    });
    companyMock.mockResolvedValueOnce({
      name: "Code en stock",
      address: "une adresse",
      orgId: "IT09301420155",
      vatNumber: "IT09301420155",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr"
    });

    companyMock.mockResolvedValueOnce(null);

    const company = await getCompanyInfos("IT09301420155");

    expect(company).toStrictEqual({
      siret: undefined,
      orgId: "IT09301420155",
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT",
      contactEmail: "benoit.guigal@protonmail.com",
      contactPhone: "06 67 78 xx xx",
      website: "http://benoitguigal.fr",
      isRegistered: true,
      ecoOrganismeAgreements: [],
      companyTypes: [],
      wasteProcessorTypes: [],
      collectorTypes: [],
      wasteVehiclesType: [],
      installation: undefined,
      statutDiffusionEtablissement: "O",
      allowBsdasriTakeOverWithoutSignature: undefined,
      brokerReceipt: undefined,
      codeCommune: undefined,
      contact: undefined,
      etatAdministratif: "A",
      libelleNaf: undefined,
      naf: undefined,
      traderReceipt: undefined,
      transporterReceipt: undefined,
      vhuAgrementBroyeur: undefined,
      vhuAgrementDemolisseur: undefined
    });
  });

  it("should return VAT search only if not registered", async () => {
    vatMock.mockResolvedValueOnce({
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT",
      statutDiffusionEtablissement: "O",
      etatAdministratif: "A"
    });
    companyMock.mockResolvedValueOnce(null);
    const company = await getCompanyInfos("IT09301420155");

    expect(company).toStrictEqual({
      siret: undefined,
      orgId: "IT09301420155",
      vatNumber: "IT09301420155",
      name: "Code en stock",
      address: "une adresse",
      codePaysEtrangerEtablissement: "IT",
      isRegistered: false,
      companyTypes: [],
      wasteProcessorTypes: [],
      collectorTypes: [],
      wasteVehiclesType: [],
      ecoOrganismeAgreements: [],
      installation: undefined,
      statutDiffusionEtablissement: "O",
      allowBsdasriTakeOverWithoutSignature: undefined,
      brokerReceipt: undefined,
      codeCommune: undefined,
      contact: undefined,
      contactPhone: undefined,
      contactEmail: undefined,
      etatAdministratif: "A",
      libelleNaf: undefined,
      naf: undefined,
      traderReceipt: undefined,
      transporterReceipt: undefined,
      vhuAgrementBroyeur: undefined,
      vhuAgrementDemolisseur: undefined,
      website: undefined
    });
  });
});
