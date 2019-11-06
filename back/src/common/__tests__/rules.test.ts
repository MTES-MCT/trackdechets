import { checkIsCompanyAdmin, isCompanyAdmin } from "../rules";

describe("checkIsCompanyAdmin", () => {
  it("should return true if the user is admin of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "ADMIN" }]);
    const isCompanyAdmin = await checkIsCompanyAdmin(
      "id",
      "85001946400013",
      prisma
    );
    expect(isCompanyAdmin).toBe(true);
  });

  it("should return false if the user is member of the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([{ role: "MEMBER" }]);
    const isCompanyAdmin = await checkIsCompanyAdmin(
      "id",
      "85001946400013",
      prisma
    );
    expect(isCompanyAdmin).toBe(false);
  });

  it("should return false if the user does not belong to the company", async () => {
    const prisma = {
      companyAssociations: jest.fn()
    };

    prisma.companyAssociations.mockResolvedValue([]);
    const isCompanyAdmin = await checkIsCompanyAdmin(
      "id",
      "85001946400013",
      prisma
    );
    expect(isCompanyAdmin).toBe(false);
  });
});
