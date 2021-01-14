import { updateCompanyFn as updateCompany } from "../updateCompany";
import { MutationUpdateCompanyArgs } from "../../../../generated/graphql/types";

const updateCompanyMock = jest.fn();
jest.mock("src/prisma", () => ({
  company: { update: jest.fn((...args) => updateCompanyMock(...args)) }
}));

describe("updateCompany", () => {
  beforeEach(() => {
    updateCompanyMock.mockReset();
  });
  it("should call prisma.updateCompany with proper data", async () => {
    let payload: MutationUpdateCompanyArgs = {
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

    payload = {
      siret: "85001946400013",
      website: ""
    };

    await updateCompany(payload);

    expect(updateCompanyMock).toHaveBeenCalledWith({
      where: { siret: "85001946400013" },
      data: { website: "" }
    });
  });
});
