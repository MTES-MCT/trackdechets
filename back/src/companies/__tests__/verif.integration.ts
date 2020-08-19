import axios from "axios";
import * as sirene from "../sirene";
import { verifyPrestataire, anomalies } from "../verif";
import { prisma } from "../../generated/prisma-client";
import { resetDatabase } from "../../../integration-tests/helper";

// mock calls to declarations endpoint. Assume no declaration is returned
const mockAxiosGet = jest.spyOn(axios, "get");
(mockAxiosGet as jest.Mock).mockResolvedValue({ data: { etablissements: [] } });

const mockSearchCompany = jest.spyOn(sirene, "searchCompany");
// default return value use for searchCompany
const company = {
  siret: "85001946400013",
  etatAdministratif: "A",
  address: "4 Boulevard Longchamp 13001 Marseille",
  codeCommune: "13201",
  name: "CODE EN STOCK",
  naf: "62.01Z",
  libelleNaf: "Programmation informatique"
};

describe("verifyPrestataire", () => {
  afterEach(async () => {
    await resetDatabase();
    mockSearchCompany.mockReset();
  });

  it("should return SIRET_UNKNOWN if siret does not exist", async () => {
    const [_, anomaly] = await verifyPrestataire("12345678912345");
    mockSearchCompany.mockRejectedValue(new Error());
    expect(anomaly).toEqual(anomalies.SIRET_UNKNOWN);
  });

  it("should return NOT_ICPE_27XX_35XX if not ICPE", async () => {
    const [_, anomaly] = await verifyPrestataire("85001946400013");
    mockSearchCompany.mockResolvedValueOnce(company);
    expect(anomaly).toEqual(anomalies.NOT_ICPE_27XX_35XX);
  });

  it("should return NO_ANOMALY if company is an ICPE", async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    await prisma.createInstallation({
      s3icNumeroSiret: "85001946400013",
      codeS3ic: "0064.00001"
    });

    const [_, anomaly] = await verifyPrestataire("85001946400013");

    expect(anomaly).toEqual(anomalies.NO_ANOMALY);
  });

  it(`should return RUBRIQUES_INCOMPATIBLE if a company is an ICPE
      but is not allowed for dangereous waste`, async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    // create an ICPE
    await prisma.createInstallation({
      s3icNumeroSiret: "85001946400013",
      codeS3ic: "0064.00001"
    });

    // with only one rubrique for not dangereous waste
    await prisma.createRubrique({
      codeS3ic: "0064.00001",
      rubrique: "2780",
      wasteType: "NOT_DANGEROUS"
    });

    // verify this company for a dangereous waste
    const [_, anomaly] = await verifyPrestataire("85001946400013", "05 01 02*");

    expect(anomaly).toEqual(anomalies.RUBRIQUES_INCOMPATIBLE);
  });

  it("should return NO_ANOMALY if a company is an ICPE allowed for dangerous waste", async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    // create an ICPE
    await prisma.createInstallation({
      s3icNumeroSiret: "85001946400013",
      codeS3ic: "0064.00001"
    });

    // with one rubrique for dangereous waste
    await prisma.createRubrique({
      codeS3ic: "0064.00001",
      rubrique: "2780",
      wasteType: "DANGEROUS"
    });

    // verify this company for a dangereous waste
    const [_, anomaly] = await verifyPrestataire("85001946400013", "05 01 02*");

    expect(anomaly).toEqual(anomalies.NO_ANOMALY);
  });
});
