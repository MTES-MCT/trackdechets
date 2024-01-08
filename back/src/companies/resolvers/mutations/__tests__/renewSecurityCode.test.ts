import { renewSecurityCodeFn as renewSecurityCode } from "../renewSecurityCodeService";
import { ErrorCode } from "../../../../common/errors";
import { renderMail, securityCodeRenewal } from "@td/mail";
import * as utils from "../../../../utils";
import { siretify } from "../../../../__tests__/factories";

const companyMock = jest.fn();
const updateCompanyMock = jest.fn();
jest.mock("@td/prisma", () => ({
  prisma: {
    company: {
      findUnique: jest.fn((...args) => companyMock(...args)),
      update: jest.fn((...args) => updateCompanyMock(...args))
    }
  }
}));

const randomNumberMock = jest.spyOn(utils, "randomNumber");

const sendMailMock = jest.fn();

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: jest.fn((...args) => sendMailMock(...args))
}));

const getCompanyActiveUsersMock = jest.fn();

jest.mock("../../../database", () => ({
  getCompanyActiveUsers: jest.fn(() => getCompanyActiveUsersMock()),
  convertUrls: v => v
}));

describe("renewSecurityCode", () => {
  beforeEach(() => {
    companyMock.mockReset();
    updateCompanyMock.mockReset();
    randomNumberMock.mockReset();
    sendMailMock.mockReset();
    getCompanyActiveUsersMock.mockReset();
  });

  it("should throw BAD_USER_INPUT exception if siret is not 14 character long", async () => {
    expect.assertions(1);
    try {
      await renewSecurityCode("invalid");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
  it("should throw BAD_USER_INPUT exception if the company is not found", async () => {
    expect.assertions(1);
    companyMock.mockResolvedValueOnce(null);
    try {
      await renewSecurityCode("85001946400013");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
  it("should retry getting a new security code if \
    the new one is identical to the previous one", async () => {
    companyMock.mockResolvedValueOnce({
      securityCode: 1234
    });

    updateCompanyMock.mockReturnValueOnce({});
    randomNumberMock.mockReturnValueOnce(1234).mockReturnValueOnce(2345);

    getCompanyActiveUsersMock.mockReturnValueOnce([]);
    await renewSecurityCode("85001946400013");

    expect(randomNumberMock).toHaveBeenCalledTimes(2);
  });
  it("should send a notification email to all users and return updated company", async () => {
    const siret = siretify(2);
    companyMock.mockResolvedValueOnce({
      securityCode: 1234,
      name: "Code en stock",
      orgId: siret
    });
    randomNumberMock.mockReturnValueOnce(4567);

    updateCompanyMock.mockReturnValueOnce({
      orgId: siret,
      name: "Code en stock",
      securityCode: 4567
    });

    const users = [
      { email: "john.snow@trackdechets.fr", name: "John Snow" },
      { email: "arya.stark@trackdechets.fr", name: "Arya Stark" }
    ];

    const mail = renderMail(securityCodeRenewal, {
      to: users.map(u => ({ email: u.email, name: u.name })),
      variables: {
        company: {
          name: "Code en stock",
          orgId: siret
        }
      }
    });
    getCompanyActiveUsersMock.mockReturnValueOnce(users);

    const updatedCompany = await renewSecurityCode(siret);

    expect(sendMailMock).toHaveBeenCalledWith(mail);

    expect(updatedCompany).toEqual({
      orgId: siret,
      name: "Code en stock",
      securityCode: 4567
    });
  });
});
