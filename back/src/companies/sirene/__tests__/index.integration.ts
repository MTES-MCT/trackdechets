import prisma from "../../../prisma";
import { searchCompany } from "../../search";
import { resetDatabase } from "../../../../integration-tests/helper";
import { AnonymousCompanyError } from "../errors";
import { siretify } from "../../../__tests__/factories";
import { removeEmptyKeys } from "../../../common/converter";

const mockSearchCompany = jest.fn();
jest.mock("../searchCompany", () => ({
  __esModule: true,
  default: (...args) => mockSearchCompany(...args)
}));
// Mock the fact a siret is not found in SIRENE API's
mockSearchCompany.mockRejectedValue(new AnonymousCompanyError());

describe("searchCompany", () => {
  const OLD_ENV = process.env;

  afterAll(resetDatabase);

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should return anonymous company if it exists", async () => {
    // do not bypass sirene client call
    process.env.NODE_ENV = "production";
    const siret = siretify(1);
    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        siret,
        orgId: siret,
        name: "GENDARMERIE NATIONALE",
        address: "Rue des tropiques, Saint Tropez",
        codeNaf: "7150",
        libelleNaf: "Service du ministère de la Défense",
        codeCommune: "83119 "
      }
    });
    const searchResult = await searchCompany(siret);
    expect(searchResult).toMatchObject(removeEmptyKeys(anonymousCompany));
  });
});
