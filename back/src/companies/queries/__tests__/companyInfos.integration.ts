import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import * as sirene from "../../sirene/";
import { CompanyType } from "../../../generated/types";

const searchCompanySpy = jest.spyOn(sirene, "searchCompany");

describe("query { companyInfos(siret: <SIRET>) }", () => {
  afterEach(async () => {
    await resetDatabase();
    searchCompanySpy.mockReset();
  });

  const { query } = makeClient(null);

  test("Random company not registered in Trackdéchets", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
    });

    const gqlquery = `
      query {
        companyInfos(siret: "85001946400013") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          longitude
          latitude
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

    expect(response.data.companyInfos).toEqual({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746,
      isRegistered: false,
      contactEmail: null,
      contactPhone: null,
      website: null,
      installation: null
    });
  });

  test("ICPE registered in Trackdéchets", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
    });

    await prisma.createCompany({
      siret: "85001946400013",
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr"
    });

    await prisma.createInstallation({
      s3icNumeroSiret: "85001946400013",
      codeS3ic: "0064.00001"
    });
    const gqlquery = `
      query {
        companyInfos(siret: "85001946400013") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          longitude
          latitude
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
    // informations from insee, TD and ICPE database are merged
    expect(response.data.companyInfos).toEqual({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746,
      isRegistered: true,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      installation: {
        codeS3ic: "0064.00001"
      }
    });
  });

  test("Transporter company with transporter receipt", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await prisma.createCompany({
      siret: "85001946400013",
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      transporterReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyInfos(siret: "85001946400013") {
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

  test("Trader company with trader receipt", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      siret: "85001946400013",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await prisma.createCompany({
      siret: "85001946400013",
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      traderReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyInfos(siret: "85001946400013") {
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

  test.skip("Closed company", async () => {
    // This test is skipped because it make a real call to SIRENE API
    // It can be used to check our code is working well on closed companies
    // (etatAdministratif = "F")
    // Cf https://trello.com/c/6MtzqQk8
    searchCompanySpy.mockRestore();
    const gqlquery = `
    query {
      companyInfos(siret: "41268783200011") {
        siret
        etatAdministratif
        name
        address
        naf
        libelleNaf
        longitude
        latitude
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
      siret: "41268783200011",
      etatAdministratif: "F",
      name: "OPTIQUE LES AIX",
      address: "49 Rue de la République 18220 Les Aix-d'Angillon",
      naf: "52.4T",
      libelleNaf: "",
      longitude: 2.574108,
      latitude: 47.199802,
      isRegistered: false,
      contactEmail: null,
      contactPhone: null,
      website: null,
      installation: null
    };
    expect(company).toEqual(expected);
  });

  test.skip("Hidden company", async () => {
    // This test is skipped because it make a real call to SIRENE API
    // It can be used to check our code is working well on hidden companies
    // Cf https://trello.com/c/6MtzqQk8
    searchCompanySpy.mockRestore();
    const gqlquery = `
      query {
        companyInfos(siret: "43317467900046") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          longitude
          latitude
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
      siret: "43317467900046",
      etatAdministratif: null,
      name: null,
      address: "",
      naf: null,
      libelleNaf: "",
      longitude: null,
      latitude: null,
      isRegistered: false,
      contactEmail: null,
      contactPhone: null,
      website: null,
      installation: null
    };
    expect(company).toEqual(expected);
  });
});
