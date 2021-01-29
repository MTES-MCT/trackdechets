import { CompanyType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { companyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as sirene from "../../../sirene";

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
        libelleNaf: "Programmation informatique"
      }
    ]);

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
          isRegistered
          companyTypes
          naf
          libelleNaf
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

  it("should merge info from SIRENE, TD and ICPE", async () => {
    searchCompanySpy.mockResolvedValueOnce([
      {
        siret: "85001946400013",
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique"
      }
    ]);

    await companyFactory({
      siret: "85001946400013",
      name: "CODE EN STOCK",
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
          isRegistered
          companyTypes
          naf
          libelleNaf
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

    await prisma.installation.create({ data: icpe });
    const response = await query<any>(gqlQuery);
    const companies = response.data.searchCompanies;
    expect(companies).toHaveLength(1);
    expect(companies[0].installation.codeS3ic).toEqual(icpe.codeS3ic);
    expect(companies[0].isRegistered).toEqual(true);
    expect(companies[0].companyTypes).toEqual([CompanyType.WASTEPROCESSOR]);
  });

  it("should fetch transporter and trader receipt info", async () => {
    searchCompanySpy.mockResolvedValueOnce([
      {
        siret: "85001946400013",
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique"
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

    await prisma.company.create({
      data: {
        siret: "85001946400013",
        name: "Code en Stock",
        securityCode: 1234,
        contactEmail: "john.snow@trackdechets.fr",
        contactPhone: "0600000000",
        website: "https://trackdechets.beta.gouv.fr",
        transporterReceipt: { create: transporterReceipt },
        traderReceipt: { create: traderReceipt }
      }
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
