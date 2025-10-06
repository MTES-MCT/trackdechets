import { userWithCompanyFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { format } from "date-fns";
import { sendVerificationCodeLetter } from "..";
import axios from "axios";
import { searchCompany } from "../../../companies/search";

// Mock dependencies at the top
jest.mock("axios");
jest.mock("../../../companies/search");

const sireneInfoMock = {
  addressVoie: "40 boulevard Voltaire",
  addressCity: "Marseille",
  addressPostalCode: "13001"
};

describe("send verificationEmail", () => {
  afterAll(resetDatabase);

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    (searchCompany as jest.Mock).mockResolvedValue(sireneInfoMock);
    (axios.post as jest.Mock).mockImplementation(() => Promise.resolve({}));
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should send verification code letter using sendinbox backend", async () => {
    process.env.MY_SENDING_BOX_API_KEY = "secret";

    const { user, company } = await userWithCompanyFactory("ADMIN");

    await sendVerificationCodeLetter(company);
    expect(axios.post as jest.Mock).toHaveBeenCalledTimes(1);
    const call = (axios.post as jest.Mock).mock.calls[0];
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
