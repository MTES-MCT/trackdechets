import { getUserCompanies } from "../helper";

const mockCompanyAssociations = jest.fn();

jest.mock("../../generated/prisma-client", () => ({
  prisma: {
    companyAssociations: jest.fn(() => ({
      $fragment: mockCompanyAssociations
    }))
  }
}));

jest.mock("../cache", () => ({
  memoizeRequest: jest.fn()
}));

import { memoizeRequest } from "../cache";

const mockMemoizeRequest = memoizeRequest as jest.Mock;

describe("getUserCompanies", () => {
  it("should return an empty array if the userId is not specified", async () => {
    const companies = await getUserCompanies(null);
    expect(companies).toEqual([]);
  });
  it("should merge info from SIRENE and TD", async () => {
    mockCompanyAssociations.mockResolvedValueOnce([
      { company: { id: "id", siret: "85001946400013", securityCode: "2317" } }
    ]);
    mockMemoizeRequest.mockResolvedValueOnce({
      siret: "85001946400013",
      name: "Code en Stock",
      naf: "701Z",
      address: "4 boulevard Longchamp 13001 Marseille"
    });

    const companies = await getUserCompanies("id");
    const expected = [
      {
        id: "id",
        siret: "85001946400013",
        securityCode: "2317",
        name: "Code en Stock",
        naf: "701Z",
        address: "4 boulevard Longchamp 13001 Marseille"
      }
    ];
    expect(companies).toEqual(expected);
  });
  it("should not set siret to empty string", async () => {
    mockCompanyAssociations.mockResolvedValueOnce([
      { company: { id: "id", siret: "85001946400013", securityCode: "2317" } }
    ]);
    mockMemoizeRequest.mockReturnValueOnce(
      Promise.resolve({
        siret: "",
        name: "",
        naf: "",
        address: ""
      })
    );
    const companies = await getUserCompanies("id");
    expect(companies[0].siret).toEqual("85001946400013");
  });
});
