import createCompany from "../create-company";
import { ErrorCode } from "../../../common/errors";

const context = {
  prisma: {
    $exists: {
      company: jest.fn(() => Promise.resolve(false))
    },
    createCompany: jest.fn(() => Promise.resolve({ id: "companyId" })),
    createCompanyAssociation: jest.fn(() => ({
      company: jest.fn(() => Promise.resolve())
    }))
  },
  user: { id: "USER_ID" }
};

describe("Create company resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw when company already exists", async () => {
    expect.assertions(1);

    const companyInput = { siret: "a siret" };
    context.prisma.$exists.company.mockResolvedValue(true);

    try {
      await createCompany(null, { companyInput }, context as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should create company and related association", async () => {
    const companyInput = { siret: "a siret" };
    context.prisma.$exists.company.mockResolvedValue(false);

    await createCompany(null, { companyInput }, context as any);

    expect(context.prisma.createCompanyAssociation).toHaveBeenCalledTimes(1);
  });
});
