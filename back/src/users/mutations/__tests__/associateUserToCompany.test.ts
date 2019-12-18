import { associateUserToCompany } from "../associateUserToCompany";
import { ErrorCode } from "../../../common/errors";

const mockCompanyAssociations = jest.fn();
const mockCreateCompanyAssociations = jest.fn();

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    companyAssociations: jest.fn((...args) => mockCompanyAssociations(...args)),
    createCompanyAssociation: jest.fn((...args) =>
      mockCreateCompanyAssociations(...args)
    )
  }
}));

describe("associateUserToCompany", () => {
  beforeEach(() => {
    mockCompanyAssociations.mockReset();
    mockCreateCompanyAssociations.mockReset();
  });
  it("should throw error if association already exists", async () => {
    mockCompanyAssociations.mockResolvedValueOnce([
      {
        user: { id: "userId" },
        company: { siret: "85001946400013" },
        role: "MEMBER"
      }
    ]);
    expect.assertions(1);
    try {
      await associateUserToCompany("userId", "85001946400013", "MEMBER");
    } catch (e) {
      expect(e.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });
});
