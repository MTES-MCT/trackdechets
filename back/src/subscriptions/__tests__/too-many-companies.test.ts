import { CompanySubscriptionPayload } from "../../generated/prisma-client";
import { companiesSubscriptionCallback } from "../companies";

const countMock = jest.fn();
const mailMock = jest.fn();

jest.mock("../../generated/prisma-client", () => ({
  prisma: {
    companyAssociations: () => ({
      $fragment: jest.fn(() => [{ user: { id: "an_id", name: "a_name" } }])
    }),
    companyAssociationsConnection: () => ({
      aggregate: () => ({ count: countMock })
    })
  }
}));

jest.mock("../../common/mails.helper", () => ({
  sendMail: () => mailMock()
}));

describe("warnIfUserCreatesTooManyCompanies subscription", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should send mail if user has too much companies", async () => {
    const payload: CompanySubscriptionPayload = {
      mutation: "CREATED",
      node: {
        id: "id",
        siret: "siret",
        companyTypes: [],
        createdAt: "2019-10-16T07:45:13.959Z",
        updatedAt: "2019-10-16T07:45:13.959Z",
        securityCode: 1234,
        documentKeys: []
      },
      previousValues: null,
      updatedFields: []
    };

    // 10 > MAX
    countMock.mockResolvedValue(10);
    await companiesSubscriptionCallback(payload);

    expect(mailMock).toHaveBeenCalledTimes(1);
  });

  test("should not send mail if user has low number of companies", async () => {
    const payload: CompanySubscriptionPayload = {
      mutation: "CREATED",
      node: {
        id: "id",
        siret: "siret",
        companyTypes: [],
        createdAt: "2019-10-16T07:45:13.959Z",
        updatedAt: "2019-10-16T07:45:13.959Z",
        securityCode: 1234,
        documentKeys: []
      },
      previousValues: null,
      updatedFields: []
    };

    // 1 < MAX
    countMock.mockResolvedValue(1);
    await companiesSubscriptionCallback(payload);

    expect(mailMock).not.toHaveBeenCalled();
  });
});
