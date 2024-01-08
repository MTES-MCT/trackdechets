import axios from "axios";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { companyFactory, siretify } from "../../../__tests__/factories";
import { setCompanyName } from "../set-company-name";

jest.mock("axios");

// Skip this test in a normal test run because it targets a function
// that should be run only once in "npm run update"

describe.skip("setCompanyName", () => {
  afterAll(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("should set company name where it was not previously set", async () => {
    // Frontier, name is set
    const frontier = await companyFactory({
      siret: siretify(1),
      name: "Frontier SAS",
      securityCode: 1234
    });

    // LP, name is not set
    const lp = await companyFactory({
      siret: siretify(2),
      name: null as any
    });
    const resp1 = { status: 200, data: { name: "LP" } };
    (axios.get as jest.Mock).mockResolvedValueOnce(resp1);

    const siret = siretify(6);
    // Code en stock, name is not set
    const codeEnStock = await companyFactory({
      siret,
      name: null as any
    });
    const resp2 = { status: 200, data: { name: "CODE EN STOCK" } };
    (axios.get as jest.Mock).mockResolvedValueOnce(resp2);

    // Unknown SIRET, name is not set
    const unknown = await companyFactory({
      siret: "xxxxxxxxxxxxxx",
      name: null as any
    });

    // expect insee service to retunr 404
    const resp3 = { status: 404 };
    (axios.get as jest.Mock).mockResolvedValueOnce(resp3);

    await setCompanyName();

    // Frontier name was already set, it should be unchanged
    const frontierUpdated = await prisma.company.findUniqueOrThrow({
      where: { siret: frontier.siret! }
    });
    expect(frontierUpdated.name).toEqual(frontier.name);

    // LP name should be set
    const lpUpdated = await prisma.company.findUniqueOrThrow({
      where: { siret: lp.siret! }
    });
    expect(lpUpdated.name).toEqual("LP");

    // Code en Stock name should be set
    const codeEnStockUpdated = await prisma.company.findUniqueOrThrow({
      where: {
        siret: codeEnStock.siret!
      }
    });
    expect(codeEnStockUpdated.name).toEqual("CODE EN STOCK");

    // Unknown company name should not be set
    const unknownUpdated = await prisma.company.findUniqueOrThrow({
      where: {
        siret: unknown.siret!
      }
    });
    expect(unknownUpdated.name).toBeNull();
  });
});
