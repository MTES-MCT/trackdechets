import { updateCompanyFn as updateCompany } from "../updateCompanyService";
import { MutationUpdateCompanyArgs } from "../../../../generated/graphql/types";

const updateCompanyMock = jest.fn();
jest.mock("../../../../prisma", () => ({
  company: {
    update: jest.fn((...args) => updateCompanyMock(...args))
  }
}));

const mockGetUpdatedCompanyNameAndAddress = jest.fn();
// Mock external search services
jest.mock("../../../database", () => ({
  // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
  ...jest.requireActual("../../../database"),
  getUpdatedCompanyNameAndAddress: (...args) =>
    mockGetUpdatedCompanyNameAndAddress(...args)
}));

const anyCompany = { orgId: "123", name: "name", address: "address" };

describe("updateCompany", () => {
  beforeEach(() => {
    updateCompanyMock.mockReset();
  });
  it("should call prisma.updateCompany with proper data", async () => {
    updateCompanyMock.mockResolvedValue({});

    let payload: MutationUpdateCompanyArgs = {
      id: "85001946400013",
      gerepId: "gerepId"
    };
    await updateCompany(payload, anyCompany);
    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { gerepId: "gerepId" }
    });

    payload = {
      id: "85001946400013",
      companyTypes: ["PRODUCER"]
    };

    await updateCompany(payload, anyCompany);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { companyTypes: { set: ["PRODUCER"] } }
    });

    payload = {
      id: "85001946400013",
      website: ""
    };

    await updateCompany(payload, anyCompany);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { website: "" }
    });
  }, 10000);
});
