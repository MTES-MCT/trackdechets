import updateCompany, { Paylod } from "../updateCompany";

const updateCompanyMock = jest.fn();
jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    updateCompany: jest.fn((...args) => updateCompanyMock(...args))
  }
}));

describe("updateCompany", () => {
  beforeEach(() => {
    updateCompanyMock.mockReset();
  });
  it("should call prisma.updateCompany with proper data", async () => {
    let payload: Paylod = {
      siret: "85001946400013",
      gerepId: "gerepId"
    };
    await updateCompany(payload);
    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { siret: "85001946400013" },
      data: { gerepId: "gerepId" }
    });

    payload = {
      siret: "85001946400013",
      companyTypes: ["PRODUCER"]
    };

    await updateCompany(payload);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { siret: "85001946400013" },
      data: { companyTypes: { set: ["PRODUCER"] } }
    });
  });
});
