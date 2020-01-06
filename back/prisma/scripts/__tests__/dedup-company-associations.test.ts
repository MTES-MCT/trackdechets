import { dedupCompanyAssociations } from "../dedup-company-associations";

const companyAssociationMock = jest.fn();
const deleteManyCompanyAssociationsMock = jest.fn();

jest.mock("../../../src/generated/prisma-client", () => ({
  prisma: {
    companyAssociations: jest.fn(() => ({
      $fragment: companyAssociationMock
    })),
    deleteManyCompanyAssociations: jest.fn((...args) =>
      deleteManyCompanyAssociationsMock(...args)
    )
  }
}));

describe("dedubeCompanyAssociations", () => {
  beforeEach(() => {
    companyAssociationMock.mockReset();
    deleteManyCompanyAssociationsMock.mockReset();
  });

  it("should make company association unique for a pair (company, user)\
     keeping the most privileged association", async () => {
    const associations = [
      // association without duplicate
      {
        id: "association1",
        user: { email: "user1" },
        company: { siret: "company1" },
        role: "ADMIN"
      },
      // duplicate with same ADMIN role
      {
        id: "association2",
        user: { email: "user2" },
        company: { siret: "company1" },
        role: "ADMIN"
      },
      {
        id: "association3",
        user: { email: "user2" },
        company: { siret: "company1" },
        role: "ADMIN"
      },
      // duplicate with same MEMBER role
      {
        id: "association4",
        user: { email: "user3" },
        company: { siret: "company1" },
        role: "MEMBER"
      },
      {
        id: "association5",
        user: { email: "user3" },
        company: { siret: "company1" },
        role: "MEMBER"
      },
      // duplicate with different roles
      {
        id: "association6",
        user: { email: "user4" },
        company: { siret: "company1" },
        role: "MEMBER"
      },
      {
        id: "association7",
        user: { email: "user4" },
        company: { siret: "company1" },
        role: "MEMBER"
      },
      {
        id: "association8",
        user: { email: "user4" },
        company: { siret: "company1" },
        role: "ADMIN"
      },
      {
        id: "association9",
        user: { email: "user4" },
        company: { siret: "company1" },
        role: "ADMIN"
      }
    ];
    companyAssociationMock.mockResolvedValueOnce(associations);

    await dedupCompanyAssociations();

    expect(deleteManyCompanyAssociationsMock).toHaveBeenCalledWith({
      id_in: ["association3"]
    });
    expect(deleteManyCompanyAssociationsMock).toHaveBeenCalledWith({
      id_in: ["association5"]
    });
    expect(deleteManyCompanyAssociationsMock).toHaveBeenCalledWith({
      id_in: ["association6", "association7", "association9"]
    });
  });
});
