import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

// jest.mock("../../insee", () => ({
//   searchCompany: jest.fn(() => Promise.resolve())
// }));

describe("query { companyInfos(siret: <SIRET>) }", () => {
  afterEach(() => resetDatabase());

  const { query } = makeClient(null);

  test("Random company not registered in Trackdéchets", async () => {
    const gqlquery = `
      query {
        companyInfos(siret: "85001946400013") {
          siret
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
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "6201Z",
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
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "6201Z",
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

  // TODO fix this test
  test.skip("Closed company", async () => {
    const gqlquery = `
    query {
      companyInfos(siret: "41268783200011") {
        siret
        name
      }
    }`;
    const response = await query<any>(gqlquery);
    console.log(response);
  });

  // TODO fix this test
  test.skip("Hidden company", async () => {
    const gqlquery = `
      query {
        companyInfos(siret: "43317467900046") {
          siret
          name
        }
      }`;
    const response = await query<any>(gqlquery);
    console.log(response);
  });
});
