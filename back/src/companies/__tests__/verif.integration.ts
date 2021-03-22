import axios from "axios";
import prisma from "../../prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import * as sirene from "../sirene";
import {
  anomalies,
  verifyPrestataire,
  sendVerificationCodeLetters
} from "../verif";
import * as post from "../../common/post/index";
import { companyFactory } from "../../__tests__/factories";
import { CompanyType, CompanyVerificationStatus } from "@prisma/client";

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
  libelleNaf: "Programmation informatique",
  addressVoie: "4 boulevard Longchamp",
  addressCity: "Marseille",
  addressPostalCode: "13001"
};

describe("verifyPrestataire", () => {
  afterEach(async () => {
    await resetDatabase();
    mockSearchCompany.mockReset();
  });

  it("should return SIRET_UNKNOWN if siret does not exist", async () => {
    mockSearchCompany.mockRejectedValue(new Error());
    const [_, anomaly] = await verifyPrestataire("12345678912345");
    expect(anomaly).toEqual(anomalies.SIRET_UNKNOWN);
  });

  it("should return NOT_ICPE_27XX_35XX if not ICPE", async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    const [_, anomaly] = await verifyPrestataire("85001946400013");
    expect(anomaly).toEqual(anomalies.NOT_ICPE_27XX_35XX);
  });

  it("should return NO_ANOMALY if company is an ICPE", async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    await prisma.installation.create({
      data: {
        s3icNumeroSiret: "85001946400013",
        codeS3ic: "0064.00001"
      }
    });

    const [_, anomaly] = await verifyPrestataire("85001946400013");

    expect(anomaly).toEqual(anomalies.NO_ANOMALY);
  });

  it(`should return RUBRIQUES_INCOMPATIBLE if a company is an ICPE
      but is not allowed for dangereous waste`, async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    // create an ICPE
    await prisma.installation.create({
      data: {
        s3icNumeroSiret: "85001946400013",
        codeS3ic: "0064.00001"
      }
    });

    // with only one rubrique for not dangereous waste
    await prisma.rubrique.create({
      data: {
        codeS3ic: "0064.00001",
        rubrique: "2780",
        wasteType: "NOT_DANGEROUS"
      }
    });

    // verify this company for a dangereous waste
    const [_, anomaly] = await verifyPrestataire("85001946400013", "05 01 02*");

    expect(anomaly).toEqual(anomalies.RUBRIQUES_INCOMPATIBLE);
  });

  it("should return NO_ANOMALY if a company is an ICPE allowed for dangerous waste", async () => {
    mockSearchCompany.mockResolvedValueOnce(company);
    // create an ICPE
    await prisma.installation.create({
      data: {
        s3icNumeroSiret: "85001946400013",
        codeS3ic: "0064.00001"
      }
    });

    // with one rubrique for dangereous waste
    await prisma.rubrique.create({
      data: {
        codeS3ic: "0064.00001",
        rubrique: "2780",
        wasteType: "DANGEROUS"
      }
    });

    // verify this company for a dangereous waste
    const [_, anomaly] = await verifyPrestataire("85001946400013", "05 01 02*");

    expect(anomaly).toEqual(anomalies.NO_ANOMALY);
  });
});

const sendLetterSpy = jest.fn();
jest
  .spyOn(post, "sendVerificationCodeLetter")
  .mockImplementation((...args) => sendLetterSpy(...args));

describe("sendVerificationCodeLetters", () => {
  afterEach(resetDatabase);

  const RealDate = Date;
  const now = new Date("2019-10-04T20:00:00.000Z");

  function mockDate() {
    Date.now = jest.fn(() => now) as jest.Mock;
  }
  afterEach(() => {
    Date = RealDate;
  });

  it("should send verification code letters to all companies that joined four days ago", async () => {
    mockDate();
    // company created today, should not be sent a letter
    const _company1 = await companyFactory({
      createdAt: new Date("2019-10-04T14:00:00.000Z"),
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 4 days ago but already verified, should not be sent a letter
    const _company2 = await companyFactory({
      createdAt: new Date("2019-09-30T00:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 3 days ago at midgnight, should not be sent a letter
    const _company3 = await companyFactory({
      createdAt: new Date("2019-10-01T00:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 4 days at midnight, should be sent a letter
    const company4 = await companyFactory({
      createdAt: new Date("2019-09-30T00:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 4 days ago just before midnight, should be sent a letter
    const company5 = await companyFactory({
      createdAt: new Date("2019-09-30T23:59:59.000Z"),
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 5 days ago, should not be sent a letter
    const _company6 = await companyFactory({
      createdAt: new Date("2019-09-29T14:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    // company created 4 days ago with status PRODUCER only, should not be sent a letter
    const _company7 = await companyFactory({
      createdAt: new Date("2019-09-30T00:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      companyTypes: {
        set: [CompanyType.PRODUCER]
      }
    });

    // company created 4 days ago but letter already sent, should not be sent a letter
    const _company8 = await companyFactory({
      createdAt: new Date("2019-09-30T00:00:00.000Z"),
      verificationStatus: CompanyVerificationStatus.LETTER_SENT,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    await sendVerificationCodeLetters();
    //expect(sendLetterSpy).toBeCalledTimes(2);
    expect(sendLetterSpy).toHaveBeenCalledWith(company4);
    expect(sendLetterSpy).toHaveBeenCalledWith(company5);

    // the verification status should be updated
    const company4Updated = await prisma.company.findUnique({
      where: { id: company4.id }
    });
    const company5Updated = await prisma.company.findUnique({
      where: { id: company5.id }
    });
    expect(company4Updated.verificationStatus).toEqual(
      CompanyVerificationStatus.LETTER_SENT
    );
    expect(company5Updated.verificationStatus).toEqual(
      CompanyVerificationStatus.LETTER_SENT
    );
  });
});
