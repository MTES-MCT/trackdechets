import { getCompanyActiveUsers } from "../companyUsers";

const ASSOCIATIONS = [
  {
    user: {
      id: "1",
      name: "Jane"
    },
    role: "ADMIN"
  },
  {
    user: {
      id: "2",
      name: "John"
    },
    role: "MEMBER"
  }
];

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    companyAssociations: jest.fn(() => ({
      $fragment: jest.fn(() => Promise.resolve(ASSOCIATIONS))
    }))
  }
}));

describe("getCompanyActiveUsers", () => {
  it("should return the company's active users with their role", async () => {
    const users = await getCompanyActiveUsers("123");

    expect(users).toEqual(
      ASSOCIATIONS.map(association => ({
        ...association.user,
        role: association.role,
        isPendingInvitation: false
      }))
    );
  });
});
