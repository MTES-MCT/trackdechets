import { User } from "@prisma/client";
import {
  inviteUserToJoin,
  notifyUserOfInvite
} from "../../../../mailer/templates";
import { renderMail } from "../../../../mailer/templates/renderers";
import { inviteUserToCompanyFn as inviteUserToCompany } from "../inviteUserToCompany";

const userMock = jest.fn();
const companyMock = jest.fn();

jest.mock("../../../../prisma", () => ({
  user: { findUnique: jest.fn((...args) => userMock(...args)) },
  company: { findUnique: jest.fn((...args) => companyMock(...args)) }
}));

const sendMailMock = jest.fn();

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: jest.fn(mail => sendMailMock(mail))
}));

const associateUserToCompanyMock = jest.fn();
const createUserAccountHashMock = jest.fn();
jest.mock("../../../database", () => ({
  associateUserToCompany: jest.fn((...args) => {
    associateUserToCompanyMock(...args);
  }),
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
    const user = { id: "id", name: "Arya Stark" };
    userMock.mockResolvedValueOnce(user);

    const company = { siret: "85001946400013", name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    const adminUser = { name: "John Snow" } as User;

    await inviteUserToCompany(adminUser, {
      email: "arya.stark@trackdechets.fr",
      siret: "85001946400013",
      role: "MEMBER"
    });

    expect(associateUserToCompanyMock).toBeCalledWith(
      "id",
      "85001946400013",
      "MEMBER"
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      renderMail(notifyUserOfInvite, {
        to: [{ email: "arya.stark@trackdechets.fr", name: "Arya Stark" }],
        variables: { companyName: "Code en Stock" }
      })
    );
  });

  it("should create a temporary association if user does not exist", async () => {
    userMock.mockResolvedValueOnce(null);
    const userAccountHash = {
      email: "arya.stark@trackdechets.fr",
      hash: "hash",
      role: "MEMBER"
    };
    createUserAccountHashMock.mockResolvedValueOnce(userAccountHash);

    const company = { siret: "85001946400013", name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    const adminUser = { name: "John Snow" } as User;

    await inviteUserToCompany(adminUser, {
      email: "arya.stark@trackdechets.fr",
      siret: "85001946400013",
      role: "MEMBER"
    });

    expect(createUserAccountHashMock).toHaveBeenCalledWith(
      "arya.stark@trackdechets.fr",
      "MEMBER",
      "85001946400013"
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      renderMail(inviteUserToJoin, {
        to: [
          {
            name: "arya.stark@trackdechets.fr",
            email: "arya.stark@trackdechets.fr"
          }
        ],
        variables: { companyName: "Code en Stock", hash: "hash" }
      })
    );
  });

  it("should sanitize email", async () => {
    userMock.mockResolvedValueOnce(null);
    const userAccountHash = {
      email: "Arya.Stark@trackdechets.fr",
      hash: "hash",
      role: "MEMBER"
    };
    createUserAccountHashMock.mockResolvedValueOnce(userAccountHash);

    const company = { siret: "85001946400013", name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    const adminUser = { name: "John Snow" } as User;

    await inviteUserToCompany(adminUser, {
      email: "arya.stark@trackdechets.fr",
      siret: "85001946400013",
      role: "MEMBER"
    });

    expect(createUserAccountHashMock).toHaveBeenCalledWith(
      "arya.stark@trackdechets.fr",
      "MEMBER",
      "85001946400013"
    );
  });
});
