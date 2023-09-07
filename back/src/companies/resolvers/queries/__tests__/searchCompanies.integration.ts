import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { companyFactory, siretify } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as search from "../../../search";

const searchCompanySpy = jest.spyOn(search, "searchCompanies");

describe("query { searchCompanies(clue, department) }", () => {
  let query: ReturnType<typeof makeClient>["query"];
  beforeAll(() => {
    const client = makeClient(null);
    query = client.query;
  });

  afterEach(async () => {
    await resetDatabase();
    searchCompanySpy.mockReset();
  });

  it("should return list of companies based on clue", async () => {
    const siret = siretify(1);

    searchCompanySpy.mockResolvedValueOnce([
      {
        siret,
        orgId: siret,
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        addressVoie: "4 boulevard Longchamp",
        addressCity: "Marseille",
        addressPostalCode: "13001"
      }
    ]);

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
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

  it("should merge info from SIRENE and ICPE", async () => {
    const siret = siretify(1);

    searchCompanySpy.mockResolvedValueOnce([
      {
        siret,
        orgId: siret,
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        addressVoie: "4 boulevard Longchamp",
        addressCity: "Marseille",
        addressPostalCode: "13001"
      }
    ]);

    const gqlQuery = `
      query {
        searchCompanies(clue: "Code en Stock"){
          siret
          address
          name
          naf
          libelleNaf
          installation {
            codeS3ic
          }
        }
      }
    `;

    const icpe = {
      s3icNumeroSiret: siret,
      codeS3ic: "0064.00001"
    };

    await prisma.installation.create({ data: icpe });
    const response = await query<any>(gqlQuery);
    const companies = response.data.searchCompanies;
    expect(companies).toHaveLength(1);
    expect(companies[0].installation.codeS3ic).toEqual(icpe.codeS3ic);
  });

  it("should fetch transporter and trader receipt info", async () => {
    const siret = siretify(1);

    searchCompanySpy.mockResolvedValueOnce([
      {
        siret,
        orgId: siret,
        address: "4 Boulevard Longchamp 13001 Marseille",
        name: "CODE EN STOCK",
        naf: "6201Z",
        libelleNaf: "Programmation informatique",
        addressVoie: "4 boulevard Longchamp",
        addressCity: "Marseille",
        addressPostalCode: "13001"
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

    await companyFactory({
      siret,
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
