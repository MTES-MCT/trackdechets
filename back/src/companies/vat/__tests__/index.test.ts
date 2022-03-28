import { client, makeSoapClient } from "../vies/searchVat";
import { ErrorCode } from "../../../common/errors";

describe("searchVat client", () => {
  const checkVatAsyncMock = jest.fn();
  const makeSoapClientTest = jest.fn();
  makeSoapClientTest.mockResolvedValue({
    checkVatAsync: checkVatAsyncMock
  });
  const createClientTest = makeSoapClient(makeSoapClientTest);

  jest.mock("../vies/searchVat", () => ({
    makeSoapClient: makeSoapClientTest
  }));

  beforeEach(() => {
    checkVatAsyncMock.mockReset();
  });

  it(`should throw BAD_USER_INPUT error if
    the VAT begin with a wrong country code`, async () => {
    expect.assertions(4);
    // uppercase
    try {
      await client("TT1234", createClientTest);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(e.message).toBe(
        "Le numéro de TVA intracommunautaire ne commence pas par un code pays européen valide"
      );
    }
    // lower case
    try {
      await client("zx1234", createClientTest);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(e.message).toBe(
        "Le numéro de TVA intracommunautaire ne commence pas par un code pays européen valide"
      );
    }
  });

  it(`should throw BAD_USER_INPUT error if
    the VAT is not valid`, async () => {
    expect.assertions(2);
    //
    try {
      await client("ES12345678910", createClientTest);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(e.message).toBe(
        "Le numéro de TVA intracommunautaire n'est pas valide"
      );
    }
  });

  it(`should throw BAD_USER_INPUT error if
    the VAT is not found`, async () => {
    expect.assertions(2);
    checkVatAsyncMock.mockResolvedValueOnce([
      {
        valid: false
      }
    ]);
    try {
      await client("IT09301420155", createClientTest);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(e.message).toBe(
        "Aucun établissement trouvé avec ce numéro TVA intracommunautaire"
      );
    }
  });

  it(`should return a ViesResult`, async () => {
    const testValue = {
      vatNumber: "IT09301420155",
      address: "address",
      name: "name",
      codePaysEtrangerEtablissement: "IT"
    };
    checkVatAsyncMock.mockResolvedValueOnce([testValue]);
    const res = await client("IT09301420155", createClientTest);
    expect(res).toStrictEqual(testValue);
  });
});
