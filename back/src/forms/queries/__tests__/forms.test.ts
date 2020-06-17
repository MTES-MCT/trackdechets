import forms from "../forms";

const prisma = {
  forms: jest.fn((..._args) => Promise.resolve([]))
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    forms: (...args) => prisma.forms(...args)
  }
}));

const getUserCompaniesMock = jest.fn();
jest.mock("../../../companies/queries/userCompanies", () => ({
  getUserCompanies: () => getUserCompaniesMock()
}));

describe("Forms query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should query forms when user belongs to company", async () => {
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" }]);
    await forms("userId", { siret: "a siret" });

    expect(prisma.forms).toHaveBeenCalled();
  });
});
