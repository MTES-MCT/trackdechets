import { inviteUserToCompany } from "../inviteUserToCompany";
import { userMails } from "../../mails";
import { User } from "../../../generated/prisma-client";

const userMock = jest.fn();
const companyMock = jest.fn();

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    user: jest.fn((...args) => userMock(...args)),
    company: jest.fn((...args) => companyMock(...args))
  }
}));

const sendMailMock = jest.fn();

jest.mock("../../../common/mails.helper", () => ({
  sendMail: jest.fn(mail => sendMailMock(mail))
}));

const associateUserToCompanyMock = jest.fn();
jest.mock("../associateUserToCompany", () => ({
  associateUserToCompany: jest.fn((...args) => {
    associateUserToCompanyMock(...args);
  })
}));

const createUserAccountHashMock = jest.fn();
jest.mock("../createUserAccountHash", () => ({
  createUserAccountHash: jest.fn((...args) =>
    createUserAccountHashMock(...args)
  )
}));

describe("inviteUserToCompany", () => {
  beforeEach(() => {
    userMock.mockReset();
    companyMock.mockReset();
    sendMailMock.mockReset();
    associateUserToCompanyMock.mockReset();
    createUserAccountHashMock.mockReset();
  });

  it("should associate existing user to company if user exists", async () => {
    const user = { id: "id", name: "Arya Starck" };
    userMock.mockResolvedValueOnce(user);

    const company = { siret: "85001946400013", name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    const adminUser = { name: "John Snow" } as User;

    await inviteUserToCompany(
      adminUser,
      "arya.starck@gmail.com",
      "85001946400013",
      "MEMBER"
    );

    expect(associateUserToCompanyMock).toBeCalledWith(
      "id",
      "85001946400013",
      "MEMBER"
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      userMails.notifyUserOfInvite(
        "arya.starck@gmail.com",
        "Arya Starck",
        "John Snow",
        "Code en Stock"
      )
    );
  });

  it("should create a temporary association if user does not exist", async () => {
    userMock.mockResolvedValueOnce(null);
    createUserAccountHashMock.mockResolvedValueOnce("hash");

    const company = { siret: "85001946400013", name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    const adminUser = { name: "John Snow" } as User;

    await inviteUserToCompany(
      adminUser,
      "arya.starck@gmail.com",
      "85001946400013",
      "MEMBER"
    );

    expect(createUserAccountHashMock).toHaveBeenCalledWith(
      "arya.starck@gmail.com",
      "MEMBER",
      "85001946400013"
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      userMails.inviteUserToJoin(
        "arya.starck@gmail.com",
        "John Snow",
        "Code en Stock",
        "hash"
      )
    );
  });
});
