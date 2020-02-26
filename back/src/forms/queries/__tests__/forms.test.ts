import forms from "../forms";
import { ErrorCode } from "../../../common/errors";

const prisma = {
  forms: jest.fn(() => Promise.resolve([]))
};

const getUserCompaniesMock = jest.fn();
jest.mock("../../../companies/queries/userCompanies", () => ({
  getUserCompanies: () => getUserCompaniesMock()
}));

const defaultContext = {
  prisma,
  user: { id: "userId" },
  request: null
} as any;

describe("Forms query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if user doesnt belong to a company", async () => {
    expect.assertions(1);
    getUserCompaniesMock.mockResolvedValue([]);

    try {
      await forms(null, { type: "", siret: null }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should fail if user ask for a siret he doesnt belong to", async () => {
    expect.assertions(1);
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" }]);

    try {
      await forms(null, { type: "", siret: "another siret" }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should query forms when user belongs to company", async () => {
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" }]);
    await forms(null, { type: "", siret: "a siret" }, defaultContext);

    expect(prisma.forms).toHaveBeenCalled();
  });
});
