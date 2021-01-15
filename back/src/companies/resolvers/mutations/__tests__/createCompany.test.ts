import { User, Company } from "@prisma/client";
import { warnIfUserCreatesTooManyCompanies } from "../createCompany";

const countMock = jest.fn();
const mailMock = jest.fn();

jest.mock("../../../../prisma", () => ({
  companyAssociation: {
    count: jest.fn((...args) => countMock(...args))
  }
}));

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: () => mailMock()
}));

describe("warnIfUserCreatesTooManyCompanies subscription", () => {
  beforeEach(() => {
    countMock.mockReset();
    mailMock.mockReset();
  });

  test("should send mail if user has too much companies", async () => {
    // 10 > MAX
    countMock.mockResolvedValue(100);
    await warnIfUserCreatesTooManyCompanies(
      { id: "id", name: "name" } as User,
      { name: "companyName", siret: "siret" } as Company
    );
    expect(mailMock).toHaveBeenCalledTimes(1);
  });

  test("should not send mail if user has low number of companies", async () => {
    // 1 < MAX
    countMock.mockResolvedValue(1);
    await warnIfUserCreatesTooManyCompanies(
      { id: "id", name: "name" } as User,
      { name: "companyName", siret: "siret" } as Company
    );

    expect(mailMock).not.toHaveBeenCalled();
  });
});
