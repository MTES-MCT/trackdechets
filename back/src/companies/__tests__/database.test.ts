import { getCompanyActiveUsers } from "../database";

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

jest.mock("@td/prisma", () => ({
  prisma: {
    company: {
      findUniqueOrThrow: jest.fn(() => ({
        companyAssociations: () => Promise.resolve(ASSOCIATIONS)
      }))
    }
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
