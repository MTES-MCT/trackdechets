import { client, makeSoapClient } from "../client";
import { ErrorCode } from "../../../../common/errors";

describe("Vat search VIES client", () => {
  const checkVatAsyncMock = jest.fn();
  const makeSoapClientTest = jest.fn();
  makeSoapClientTest.mockResolvedValue({
    checkVatAsync: checkVatAsyncMock
  });
  const createClientTest = makeSoapClient(makeSoapClientTest);

  jest.mock("../client", () => ({
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
        "Le code pays du numéro de TVA intracommunautaire n'est pas valide, veuillez utiliser un code pays ISO à 2 lettres"
      );
    }
    // lower case
    try {
      await client("zx1234", createClientTest);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(e.message).toBe(
        "Le code pays du numéro de TVA intracommunautaire n'est pas valide, veuillez utiliser un code pays ISO à 2 lettres"
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
      codePaysEtrangerEtablissement: "IT",
      statutDiffusionEtablissement: "O",
      etatAdministratif: "A"
    };
    checkVatAsyncMock.mockResolvedValueOnce([testValue]);
    const res = await client("IT09301420155", createClientTest);
    expect(res).toStrictEqual(testValue);
  });
});
