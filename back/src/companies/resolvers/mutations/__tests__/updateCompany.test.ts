import { updateCompanyFn as updateCompany } from "../updateCompanyService";
import { MutationUpdateCompanyArgs } from "../../../../generated/graphql/types";

const updateCompanyMock = jest.fn();
jest.mock("../../../../prisma", () => ({
  company: { update: jest.fn((...args) => updateCompanyMock(...args)) }
}));

describe("updateCompany", () => {
  beforeEach(() => {
    updateCompanyMock.mockReset();
  });
  it("should call prisma.updateCompany with proper data", async () => {
    let payload: MutationUpdateCompanyArgs = {
      id: "85001946400013",
      gerepId: "gerepId"
    };
    await updateCompany(payload);
    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { gerepId: "gerepId" }
    });

    payload = {
      id: "85001946400013",
      companyTypes: ["PRODUCER"]
    };

    await updateCompany(payload);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { companyTypes: { set: ["PRODUCER"] } }
    });

    payload = {
      id: "85001946400013",
      website: ""
    };

    await updateCompany(payload);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { id: "85001946400013" },
      data: { website: "" }
    });
  });
});
