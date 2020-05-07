import createCompany from "../create-company";
import { ErrorCode } from "../../../common/errors";
import { User, Company } from "../../../generated/prisma-client";

const context = {
  user: { id: "USER_ID" } as User
};

const mockExists = jest.fn();
const mockCreateCompanyAssociation = jest.fn(() => ({
  company: jest.fn(() => Promise.resolve())
}));

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    $exists: {
      company: jest.fn(() => mockExists())
    },
    createCompany: jest.fn(() => Promise.resolve({ id: "companyId" })),
    createCompanyAssociation: jest.fn(() => mockCreateCompanyAssociation()),
    companyAssociationsConnection: jest.fn(() => ({
      aggregate: () => ({ count: () => 1 })
    }))
  }
}));

describe("Create company resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when company already exists", async () => {
    expect.assertions(1);

    const companyInput = { siret: "a siret" } as Company;
    mockExists.mockResolvedValueOnce(true);

    try {
      await createCompany(null, { companyInput }, context as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should create company and related association", async () => {
    const companyInput = { siret: "a siret" };
    mockExists.mockResolvedValueOnce(false);

    await createCompany(null, { companyInput }, context as any);

    expect(mockCreateCompanyAssociation).toHaveBeenCalledTimes(1);
  });
});
