import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import * as searchCompanyDecorated from "../searchCompany";
import { searchCompany } from "../../search";
import { resetDatabase } from "../../../../integration-tests/helper";

const searchCompanySpy = jest.spyOn(searchCompanyDecorated, "default");
// Mock the fact a siret is not found in SIRENE API's
searchCompanySpy.mockRejectedValue(new UserInputError("SIRET inconnue"));

describe("searchCompany", () => {
  const OLD_ENV = process.env;

  afterAll(resetDatabase);

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should return anonymous company if it exists", async () => {
    // do not bypass sirene client call
    process.env.NODE_ENV = "production";
    const siret = "11111111111111";
    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        siret,
        name: "GENDARMERIE NATIONALE",
        address: "Rue des tropiques, Saint Tropez",
        codeNaf: "7150",
        libelleNaf: "Service du ministère de la Défense",
        codeCommune: "83119 "
      }
    });
    const searchResult = await searchCompany(siret);
    expect(searchResult).toMatchObject(anonymousCompany);
  });
});
