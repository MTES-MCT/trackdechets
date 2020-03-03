import { setCompanyType, mergeUserTypes } from "../set-company-type";
import { prisma } from "../../../src/generated/prisma-client";

// make sure the updater is not registered and run during the test
jest.mock("..", () => ({
  registerUpdater: jest.fn()
}));

describe("mergeUserTypes", () => {
  it("should merge an array of userTypes", () => {
    const userType1 = ["PRODUCER", "WASTEPROCESSOR"];
    const userType2 = ["PRODUCER", "WASTEPROCESSOR", "WASTE_CENTER"];
    const merged = mergeUserTypes([userType1, userType2]);
    const expected = ["PRODUCER", "WASTEPROCESSOR", "WASTE_CENTER"];
    expect(merged).toEqual(expected);
  });

  it("should return [] if userTypes are null or empty array", () => {
    const userTypes = [null, null, []];
    const merged = mergeUserTypes(userTypes);
    expect(merged).toEqual([]);
  });
});

const mockedCompanies = [
  {
    name: "CODE EN STOCK",
    updatedAt: "2019-10-21T10:32:36.130Z",
    siret: "85001946400013",
    companyTypes: [],
    id: "cjxwzubys000n0760ce5dbeqy",
    gerepId: "",
    createdAt: "2019-07-10T08:40:54.274Z",
    securityCode: 8942,
    codeNaf: "6201Z"
  }
];

const mockedAssociationsFragment = [
  { user: { userType: ["PRODUCER", "WASTEPROCESSOR"] } },
  { user: { userType: ["PRODUCER", "WASTEPROCESSOR", "WASTE_CENTER"] } }
];

const companyAssociationsFragment = jest.fn();

companyAssociationsFragment.mockResolvedValue(mockedAssociationsFragment);

jest.mock("../../../src/generated/prisma-client", () => ({
  prisma: {
    companies: jest.fn(() => mockedCompanies),
    companyAssociations: jest.fn(() => ({
      $fragment: companyAssociationsFragment
    })),
    updateCompany: jest.fn()
  }
}));

describe("setCompanyTypes", () => {
  it("should set field companyType on Company", async () => {
    await setCompanyType();
    expect(prisma.updateCompany as jest.Mock).toHaveBeenCalledTimes(1);
    const expected = {
      data: {
        companyTypes: { set: ["PRODUCER", "WASTEPROCESSOR", "WASTE_CENTER"] }
      },
      where: { id: "cjxwzubys000n0760ce5dbeqy" }
    };
    expect(prisma.updateCompany as jest.Mock).toHaveBeenCalledWith(expected);
  });
});
