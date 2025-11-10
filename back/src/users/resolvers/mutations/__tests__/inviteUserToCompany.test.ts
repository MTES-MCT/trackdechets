import { inviteUserToJoin, notifyUserOfInvite, renderMail } from "@td/mail";
import { siretify } from "../../../../__tests__/factories";
import { inviteUserToCompanyFn as inviteUserToCompany } from "../inviteUserToCompanyService";
import { User } from "@td/prisma";

const userMock = jest.fn();
const companyMock = jest.fn();
const membershipRequestMock = jest.fn();

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: { findUnique: jest.fn((...args) => userMock(...args)) },
    company: { findUnique: jest.fn((...args) => companyMock(...args)) },
    membershipRequest: {
      updateMany: jest.fn((...args) => membershipRequestMock(...args))
    }
  }
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
    membershipRequestMock.mockReset();
    sendMailMock.mockReset();
    associateUserToCompanyMock.mockReset();
    createUserAccountHashMock.mockReset();
  });

  it("should associate existing user to company if user exists", async () => {
    const admin = {
      id: "id",
      name: "Sansa Stark",
      email: "sansa.stark@trackdechets.fr"
    };

    const user = { id: "id", name: "Arya Stark" };
    userMock.mockResolvedValueOnce(user);
    const siret = siretify(1);
    const company = { id: "companyId", siret, name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    await inviteUserToCompany(admin as User, {
      email: "arya.stark@trackdechets.fr",
      siret,
      role: "MEMBER"
    });

    expect(associateUserToCompanyMock).toHaveBeenCalledWith(
      "id",
      siret,
      "MEMBER",
      {
        automaticallyAccepted: true
      }
    );

    expect(membershipRequestMock).toHaveBeenCalledWith({
      where: {
        userId: "id",
        companyId: "companyId"
      },
      data: {
        status: "ACCEPTED",
        statusUpdatedBy: "sansa.stark@trackdechets.fr"
      }
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      renderMail(notifyUserOfInvite, {
        to: [{ email: "arya.stark@trackdechets.fr", name: "Arya Stark" }],
        variables: { companyName: "Code en Stock", companyOrgId: siret }
      })
    );
  });

  it("should create a temporary association if user does not exist", async () => {
    const admin = {
      id: "id",
      name: "Sansa Stark",
      email: "sansa.stark@trackdechets.fr"
    };
    userMock.mockResolvedValueOnce(null);
    const userAccountHash = {
      email: "arya.stark@trackdechets.fr",
      hash: "hash",
      role: "MEMBER"
    };
    createUserAccountHashMock.mockResolvedValueOnce(userAccountHash);
    const siret = siretify(1);
    const company = { siret, name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    await inviteUserToCompany(admin as User, {
      email: "arya.stark@trackdechets.fr",
      siret,
      role: "MEMBER"
    });

    expect(createUserAccountHashMock).toHaveBeenCalledWith(
      "arya.stark@trackdechets.fr",
      "MEMBER",
      siret
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      renderMail(inviteUserToJoin, {
        to: [
          {
            name: "arya.stark@trackdechets.fr",
            email: "arya.stark@trackdechets.fr"
          }
        ],
        variables: {
          companyName: "Code en Stock",
          hash: "hash",
          companyOrgId: siret
        }
      })
    );
  });

  it("should sanitize email", async () => {
    const admin = {
      id: "id",
      name: "Sansa Stark",
      email: "sansa.stark@trackdechets.fr"
    };
    userMock.mockResolvedValueOnce(null);
    const userAccountHash = {
      email: "Arya.Stark@trackdechets.fr",
      hash: "hash",
      role: "MEMBER"
    };
    createUserAccountHashMock.mockResolvedValueOnce(userAccountHash);
    const siret = siretify(1);
    const company = { siret, name: "Code en Stock" };
    companyMock.mockResolvedValueOnce(company);

    await inviteUserToCompany(admin as User, {
      email: "arya.stark@trackdechets.fr",
      siret,
      role: "MEMBER"
    });

    expect(createUserAccountHashMock).toHaveBeenCalledWith(
      "arya.stark@trackdechets.fr",
      "MEMBER",
      siret
    );
  });
});
