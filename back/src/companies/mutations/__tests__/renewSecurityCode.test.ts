import renewSecurityCode from "../renewSecurityCode";
import { ErrorCode } from "../../../common/errors";

const companyMock = jest.fn();
jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    company: jest.fn((...args) => companyMock(...args)),
    updateCompany: jest.fn(() => {})
  }
}));
const randomNumberMock = jest.fn();

jest.mock("../../../utils", () => ({
  randomNumber: jest.fn(() => randomNumberMock())
}));

describe("renewSecurityCode", () => {
  beforeEach(() => {
    companyMock.mockReset();
    randomNumberMock.mockReset();
  });

  it("should throw BAD_USER_INPUT exception if siret is not 14 character long", async () => {
    expect.assertions(1);
    try {
      await renewSecurityCode("invalid");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
  it("should throw NOT_FOUND exception if the company is not found", async () => {
    expect.assertions(1);
    companyMock.mockResolvedValueOnce(null);
    try {
      await renewSecurityCode("85001946400013");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.NOT_FOUND);
    }
  });
  it("should retry getting a new security code if \
    the new one is identitcal to the previous one", async () => {
    companyMock.mockResolvedValueOnce({
      securityCode: "1234"
    });

    randomNumberMock.mockReturnValueOnce("1234").mockReturnValueOnce("2345");

    await renewSecurityCode("85001946400013");

    expect(randomNumberMock).toHaveBeenCalledTimes(2);
  });
});
