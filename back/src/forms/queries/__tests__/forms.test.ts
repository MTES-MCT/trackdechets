import forms from "../forms";
import { ErrorCode } from "../../../common/errors";
import { FormType } from "../../../generated/graphql/types";

const prisma = {
  forms: jest.fn((...args) => Promise.resolve([]))
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

  const ACTOR: FormType = "ACTOR";
  it("should fail if user doesnt belong to a company", async () => {
    expect.assertions(1);
    getUserCompaniesMock.mockResolvedValue([]);

    try {
      await forms("userId", { type: ACTOR, siret: null });
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should fail if user ask for a siret he doesnt belong to", async () => {
    expect.assertions(1);
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" }]);
    try {
      await forms("userId", { type: ACTOR, siret: "another siret" });
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should query forms when user belongs to company", async () => {
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" }]);
    await forms("userId", { type: ACTOR, siret: "a siret" });

    expect(prisma.forms).toHaveBeenCalled();
  });
});
