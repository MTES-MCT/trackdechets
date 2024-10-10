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

jest.mock("../../../../utils");

const sendMailMock = jest.fn();

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: jest.fn((...args) => sendMailMock(...args))
}));

const getNotificationSubscribersMock = jest.fn();

jest.mock("../../../../users/notifications", () => ({
  getNotificationSubscribers: jest.fn(() => getNotificationSubscribersMock())
}));

describe("renewSecurityCode", () => {
  beforeEach(() => {
    companyMock.mockReset();
    updateCompanyMock.mockReset();
    (utils.randomNumber as jest.Mock).mockReset();
    sendMailMock.mockReset();
    getNotificationSubscribersMock.mockReset();
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
    (utils.randomNumber as jest.Mock)
      .mockReturnValueOnce(1234)
      .mockReturnValueOnce(2345);

    getNotificationSubscribersMock.mockReturnValueOnce([]);
    await renewSecurityCode("85001946400013");

    expect(utils.randomNumber as jest.Mock).toHaveBeenCalledTimes(2);
  });
  it("should send a notification email to subscribers and return updated company", async () => {
    const siret = siretify(2);
    companyMock.mockResolvedValueOnce({
      securityCode: 1234,
      name: "Code en stock",
      orgId: siret
    });
    (utils.randomNumber as jest.Mock).mockReturnValueOnce(4567);

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
    getNotificationSubscribersMock.mockReturnValueOnce(users);

    const updatedCompany = await renewSecurityCode(siret);

    expect(sendMailMock).toHaveBeenCalledWith(mail);

    expect(updatedCompany).toMatchObject({
      orgId: siret,
      name: "Code en stock",
      securityCode: 4567
    });
  });
});
