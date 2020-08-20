import { prisma } from "../../../../generated/prisma-client";
import * as queries from "../../../../companies/queries";
import { getForms } from "../forms";

const prismaMock = {
  forms: jest.spyOn(prisma, "forms")
};
const getUserCompaniesMock = jest.spyOn(queries, "getUserCompanies");
const USER_COMPANY = {
  id: "",
  siret: "a siret",
  companyTypes: [],
  createdAt: new Date().toString(),
  updatedAt: new Date().toString(),
  securityCode: 1234,
  documentKeys: []
};

describe("forms", () => {
  beforeEach(() => {
    prismaMock.forms.mockResolvedValue([]);
    getUserCompaniesMock.mockResolvedValue([USER_COMPANY]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should query forms when user belongs to company", async () => {
    await getForms("userId", { siret: USER_COMPANY.siret });
    expect(prismaMock.forms).toHaveBeenCalled();
  });

  it("should return an empty list if user has no companies", async () => {
    getUserCompaniesMock.mockResolvedValue([]);

    const forms = await getForms("userId", {});
    expect(prismaMock.forms).not.toHaveBeenCalled();
    expect(forms).toEqual([]);
  });

  it("should query forms with default first and skip when not provided", async () => {
    await getForms("userId", { first: null, skip: null });
    expect(prismaMock.forms).toHaveBeenCalledWith(
      expect.objectContaining({
        first: 50,
        skip: 0
      })
    );
  });

  it("should filter forms with a specific role", async () => {
    await getForms("userId", { roles: ["ECO_ORGANISME"] });
    expect(prismaMock.forms).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [
                {
                  ecoOrganisme: {
                    siret: USER_COMPANY.siret
                  }
                }
              ]
            }
          ])
        })
      })
    );
  });
});
