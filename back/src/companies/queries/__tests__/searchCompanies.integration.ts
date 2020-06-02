import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import * as sirene from "../../sirene";
import { resetDatabase } from "../../../../integration-tests/helper";

const searchCompanySpy = jest.spyOn(sirene, "searchCompanies");

describe("query { searchCompanies(clue, department) }", () => {
  afterEach(async () => {
    await resetDatabase();
    searchCompanySpy.mockReset();
  });

  const { query } = makeClient(null);
  it("should return list of companies based on clue", async () => {
    searchCompanySpy.mockResolvedValueOnce([
      {
        siret: "85001946400013",
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        longitude: 5.387141,
        latitude: 43.300746
      }
    ]);

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
          companyTypes
          naf
          libelleNaf
          longitude
          latitude
          installation {
            codeS3ic
          }
        }
      }
    `;
    const response = await query<any>(gqlQuery);
    const companies = response.data.searchCompanies;
    expect(companies).toHaveLength(1);
  });

  it("should merge info from SIRENE and ICPE", async () => {
    searchCompanySpy.mockResolvedValueOnce([
      {
        siret: "85001946400013",
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        longitude: 5.387141,
        latitude: 43.300746
      }
    ]);

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
          companyTypes
          naf
          libelleNaf
          longitude
          latitude
          installation {
            codeS3ic
          }
        }
      }
    `;

    const icpe = {
      s3icNumeroSiret: "85001946400013",
      codeS3ic: "0064.00001"
    };

    await prisma.createInstallation(icpe);
    const response = await query<any>(gqlQuery);
    const companies = response.data.searchCompanies;
    expect(companies).toHaveLength(1);
    expect(companies[0].installation.codeS3ic).toEqual(icpe.codeS3ic);
  });

  it("should fetch transporter and trader receipt info", async () => {
    searchCompanySpy.mockResolvedValueOnce([
      {
        siret: "85001946400013",
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        longitude: 5.387141,
        latitude: 43.300746
      }
    ]);

    const transporterReceipt = {
      receiptNumber: "transporterReceiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const traderReceipt = {
      receiptNumber: "traderReceiptNumber",
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
      transporterReceipt: { create: transporterReceipt },
      traderReceipt: { create: traderReceipt }
    });

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          transporterReceipt {
            receiptNumber
            validityLimit
            department
          }
          traderReceipt {
            receiptNumber
            validityLimit
            department
          }
        }
      }
    `;

    const response = await query<any>(gqlQuery);
    const companies = response.data.searchCompanies;
    expect(companies).toHaveLength(1);
    expect(companies[0].transporterReceipt).toEqual(transporterReceipt);
    expect(companies[0].traderReceipt).toEqual(traderReceipt);
  });
});
