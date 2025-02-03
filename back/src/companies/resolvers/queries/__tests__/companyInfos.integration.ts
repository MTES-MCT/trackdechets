import { CompanyType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { companyFactory, siretify } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  AnonymousCompanyError,
  ClosedCompanyError
} from "../../../sirene/errors";

const mockSearchSirene = jest.fn();
jest.mock("../../../sirene/searchCompany", () => ({
  __esModule: true,
  default: (...args) => mockSearchSirene(...args)
}));

describe("query { companyInfos(siret: <SIRET>) }", () => {
  let query: ReturnType<typeof makeClient>["query"];
  beforeAll(() => {
    const testClient = makeClient();
    query = testClient.query;
  });

  afterEach(async () => {
    await resetDatabase();
    mockSearchSirene.mockReset();
  });

  it("Random company not registered in Trackdéchets", async () => {
    const siret = siretify(8);
    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          companyTypes
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const response = await query<any>(gqlquery);

    expect(response.data.companyInfos).toEqual({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      isRegistered: false,
      companyTypes: [],
      contactEmail: null,
      contactPhone: null,
      website: null,
      installation: null
    });
  });

  it("ICPE registered in Trackdéchets", async () => {
    const siret = siretify(8);
    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    await companyFactory({
      siret,
      name: "Code en Stock",
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });

    await prisma.installation.create({
      data: {
        s3icNumeroSiret: siret,
        codeS3ic: "0064.00001"
      }
    });
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          companyTypes
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const response = await query<any>(gqlquery);
    // informations from insee, TD and ICPE database are merged
    expect(response.data.companyInfos).toEqual({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      isRegistered: true,
      companyTypes: [CompanyType.WASTEPROCESSOR],
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      installation: {
        codeS3ic: "0064.00001"
      }
    });
  });

  it("Transporter company with transporter receipt", async () => {
    const siret = siretify(8);
    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      transporterReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          transporterReceipt {
            receiptNumber
            validityLimit
            department
          }
        }
      }`;
    const response = await query<any>(gqlquery);
    expect(response.data.companyInfos.transporterReceipt).toEqual(receipt);
  });

  it("Trader company with trader receipt", async () => {
    const siret = siretify(8);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      traderReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          traderReceipt {
            receiptNumber
            validityLimit
            department
          }
        }
      }`;
    const response = await query<any>(gqlquery);
    expect(response.data.companyInfos.traderReceipt).toEqual(receipt);
  });

  it("Company with direct dasri takeover allowance", async () => {
    const siret = siretify(8);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      allowBsdasriTakeOverWithoutSignature: true
    });

    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          allowBsdasriTakeOverWithoutSignature
          isRegistered
        }
      }`;
    const response = await query<any>(gqlquery);
    expect(
      response.data.companyInfos.allowBsdasriTakeOverWithoutSignature
    ).toEqual(true);
    expect(response.data.companyInfos.isRegistered).toEqual(true);
  });

  it("Shows etatAdministratif=F when company is closed in INSEE", async () => {
    const siret = siretify(8);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "F",
      name: "OPTIQUE LES AIX",
      address: "49 Rue de la République 18220 Les Aix-d'Angillon"
    });
    const gqlquery = `
    query {
      companyInfos(siret: "${siret}") {
        siret
        etatAdministratif
        name
        address
        naf
        libelleNaf
        isRegistered
        contactEmail
        contactPhone
        website
        installation {
          codeS3ic
        }
      }
    }`;
    const response = await query<any>(gqlquery);
    const company = response.data.companyInfos;
    const expected = {
      siret,
      etatAdministratif: "F",
      name: "OPTIQUE LES AIX",
      address: "49 Rue de la République 18220 Les Aix-d'Angillon",
      isRegistered: false,
      contactEmail: null,
      contactPhone: null,
      installation: null,
      naf: null,
      libelleNaf: null,
      website: null
    };
    expect(company).toEqual(expected);
  });

  it("Hides company infos if non-diffusible in INSEE and not registered in TD", async () => {
    const siret = siretify(8);

    mockSearchSirene.mockRejectedValueOnce(new AnonymousCompanyError());
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const { data } = await query<any>(gqlquery);
    expect(data.companyInfos).toMatchObject({
      address: null,
      contactEmail: null,
      contactPhone: null,
      etatAdministratif: "A",
      installation: null,
      isRegistered: false,
      statutDiffusionEtablissement: "P",
      libelleNaf: null,
      naf: null,
      name: null,
      siret,
      website: null
    });
  });

  it("Hides company infos if non-diffusible in INSEE, even if registered in TD", async () => {
    mockSearchSirene.mockRejectedValueOnce(new AnonymousCompanyError());
    const siret = siretify(8);

    await companyFactory({
      siret,
      name: "Code en Stock",
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
          statutDiffusionEtablissement
        }
      }`;
    const { data } = await query<any>(gqlquery);
    expect(data.companyInfos).toMatchObject({
      address: null,
      contactEmail: null,
      contactPhone: null,
      etatAdministratif: "A",
      installation: null,
      isRegistered: true,
      statutDiffusionEtablissement: "P",
      libelleNaf: null,
      naf: null,
      name: null,
      siret,
      website: null
    });
  });

  it("should return TD-specific infos even if company is anonymous", async () => {
    // Given
    mockSearchSirene.mockRejectedValueOnce(new AnonymousCompanyError());
    const siret = siretify(8);

    await companyFactory({
      siret,
      allowBsdasriTakeOverWithoutSignature: true,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          allowBsdasriTakeOverWithoutSignature
        }
      }`;

    // When
    const { data } = await query<any>(gqlquery);

    // Then
    expect(data.companyInfos.allowBsdasriTakeOverWithoutSignature).toBeTruthy();
  });

  it("should return explicit error if non-diffusible AND closed", async () => {
    // Given
    mockSearchSirene.mockRejectedValueOnce(new ClosedCompanyError());
    const siret = siretify(8);

    // When
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
        }
      }`;
    const { errors } = await query<any>(gqlquery);

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Cet établissement est fermé");
    expect(errors[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it.each([true, false])("should return isDormant = %p", async isDormant => {
    // Given
    const company = await companyFactory({
      isDormantSince: isDormant ? new Date() : null
    });

    mockSearchSirene.mockResolvedValueOnce({
      siret: company.siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    // When
    const gqlquery = `
      query {
        companyInfos(siret: "${company.siret}") {
          siret
          isDormant
        }
      }`;
    const { errors, data } = await query<any>(gqlquery);

    // Then
    expect(errors).toBeUndefined();
    expect(data.companyInfos.isDormant).toBe(isDormant);
  });
});
