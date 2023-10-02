import { userWithCompanyFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { format } from "date-fns";

const sireneInfoMock = {
  addressVoie: "40 boulevard Voltaire",
  addressCity: "Marseille",
  addressPostalCode: "13001"
};

describe("send verificationEmail", () => {
  afterAll(resetDatabase);

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should send verification code letter using sendinbox backend", async () => {
    process.env.MY_SENDING_BOX_API_KEY = "secret";

    const { user, company } = await userWithCompanyFactory("ADMIN");

    // mock search and axios
    const { searchCompany } = require("../../../companies/search");
    const { post } = require("axios");
    jest.mock("../../../companies/search");
    (searchCompany as jest.Mock).mockResolvedValue(sireneInfoMock);
    jest.mock("axios");
    (post as jest.Mock).mockImplementation(() => Promise.resolve({}));

    const sendVerificationCodeLetter = require("..").sendVerificationCodeLetter;
    await sendVerificationCodeLetter(company);
    expect(post as jest.Mock).toHaveBeenCalledTimes(1);
    const call = (post as jest.Mock).mock.calls[0];
    expect(call[0]).toEqual("https://api.MySendingBox.fr/letters");
    expect(call[1]).toEqual(
      expect.objectContaining({
        variables: {
          code: company.verificationCode,
          company_created_at: format(company.createdAt, "yyyy-MM-dd"),
          company_name: company.name,
          company_siret: company.siret,
          user_email: user.email
        },
        to: {
          address_city: sireneInfoMock.addressCity,
          address_country: "France",
          address_line1: sireneInfoMock.addressVoie,
          address_postalcode: sireneInfoMock.addressPostalCode,
          company: company.name,
          name: user.name
        }
      })
    );
    expect(call[2]).toEqual({
      auth: { password: "", username: process.env.MY_SENDING_BOX_API_KEY }
    });
  });
});
