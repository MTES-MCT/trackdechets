import { renewSecurityCodeFn as renewSecurityCode } from "../renewSecurityCode";
import { ErrorCode } from "../../../../common/errors";
import { companyMails } from "../../../mails";

const companyMock = jest.fn();
const updateCompanyMock = jest.fn();
jest.mock("../../../../generated/prisma-client", () => ({
  prisma: {
    company: jest.fn((...args) => companyMock(...args)),
    updateCompany: jest.fn((...args) => updateCompanyMock(...args))
  }
}));
const randomNumberMock = jest.fn();

jest.mock("../../../../utils", () => ({
  randomNumber: jest.fn(() => randomNumberMock())
}));

const sendMailMock = jest.fn();

jest.mock("../../../../common/mails.helper", () => ({
  sendMail: jest.fn((...args) => sendMailMock(...args))
}));

const getCompanyActiveUsersMock = jest.fn();

jest.mock("../../../database", () => ({
  getCompanyActiveUsers: jest.fn(() => getCompanyActiveUsersMock())
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
    the new one is identitcal to the previous one", async () => {
    companyMock.mockResolvedValueOnce({
      securityCode: "1234"
    });

    updateCompanyMock.mockReturnValueOnce({});
    randomNumberMock.mockReturnValueOnce("1234").mockReturnValueOnce("2345");

    getCompanyActiveUsersMock.mockReturnValueOnce([]);
    await renewSecurityCode("85001946400013");

    expect(randomNumberMock).toHaveBeenCalledTimes(2);
  });
  it("should send a notification email to all users and return updated company", async () => {
    companyMock.mockResolvedValueOnce({
      securityCode: "1234"
    });
    randomNumberMock.mockReturnValueOnce("4567");

    updateCompanyMock.mockReturnValueOnce({
      siret: "85001946400013",
      name: "Code en stock",
      securityCode: "4567"
    });

    const users = [
      { email: "john.snow@trackdechets.fr", name: "John Snow" },
      { email: "arya.stark@trackdechets.fr", name: "Arya Stark" }
    ];

    const mail = companyMails.securityCodeRenewal(
      users.map(u => ({ email: u.email, name: u.name })),
      {
        name: "Code en stock",
        siret: "85001946400013"
      }
    );

    getCompanyActiveUsersMock.mockReturnValueOnce(users);

    const updatedCompany = await renewSecurityCode("85001946400013");

    expect(sendMailMock).toHaveBeenCalledWith(mail);

    expect(updatedCompany).toEqual({
      siret: "85001946400013",
      name: "Code en stock",
      securityCode: "4567"
    });
  });
});
