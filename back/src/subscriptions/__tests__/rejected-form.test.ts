import axios from "axios";

import { mailWhenFormIsDeclined } from "../forms";
import { FormSubscriptionPayload } from "../../generated/prisma-client";

// This form will be refused,
const mockedForm = {
  id: "xyz12345",
  wasteDetailsQuantity: 11,
  signedByTransporter: null,
  emitterCompanyName: "DECHET FACTORY SA",
  transporterCompanyName: "TRANSPORTER",
  traderCompanyAddress: "",
  transporterReceipt: "xyz",
  quantityReceived: 12,
  updatedAt: "2019-10-16T07:46:05.277Z",
  processedAt: null,
  wasteDetailsOnuCode: "",
  emitterType: "PRODUCER",
  traderValidityLimit: null,
  traderCompanyContact: "",
  wasteDetailsCode: "03 01 04*",
  processedBy: null,
  recipientCompanyAddress: "01 Rue Marie Curie 66000 Laville",
  nextDestinationDetails: null,
  transporterDepartment: "83",
  emitterPickupSite: "",
  recipientCap: "",
  emitterCompanyPhone: "06 12 45 56 78",
  emitterCompanyMail: "producer@example.com",
  wasteDetailsOtherPackaging: "",
  receivedBy: "john",
  transporterCompanySiret: "12346084400013",
  processingOperationDescription: null,
  transporterCompanyAddress: "01 Rue Marie Curie 66000 Laville",
  nextDestinationProcessingOperation: null,
  recipientCompanyPhone: "06 18 55 66 77",
  traderCompanyName: "",
  isDeleted: false,
  transporterCompanyContact: "Jim",
  traderCompanyMail: "",
  emitterCompanyAddress: "rue de la Paix, 77000 Une ville",
  sentBy: "John",
  status: "SENT",
  createdAt: "2019-10-16T07:45:13.959Z",
  recipientCompanySiret: "12346084400013",
  transporterCompanyMail: "recipient@example.com",
  wasteDetailsName: "plop",
  traderDepartment: "",
  recipientCompanyContact: "jean",
  receivedAt: "2019-10-16T00:00:00.000Z",
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-10-16T00:00:00.000Z",
  traderCompanySiret: "",
  transporterNumberPlate: "1",
  recipientProcessingOperation: "D 3",
  wasteDetailsPackagings: ["BENNE"],
  transporterValidityLimit: "2099-10-18T00:00:00.000Z",
  emitterCompanyContact: "aa",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED",
  transporterCompanyPhone: "06 18 76 02 96",
  recipientCompanyMail: "recipient@example.com",
  wasteDetailsConsistence: "SOLID",
  wasteDetailsNumberOfPackages: 1,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "12343606600011",
  processingOperationDone: null,
  readableId: "TD-19-AAA03488",
  recipientCompanyName: "Dechet processor SA",
  wasteAcceptationStatus: "REFUSED"
};

const mockedCompanyAdmins = [
  {
    name: "Eric",
    email: "producer@example.com",
    id: "qsd678",
    isActive: true,
    phone: "06 18 33 22 33"
  }
];

const formPayload = (wasteAcceptationStatus): FormSubscriptionPayload => ({
  node: {
    id: "xyz12345",
    createdAt: "2019-10-16T07:45:13.959Z",
    updatedAt: "2019-10-16T07:45:13.959Z",
    wasteAcceptationStatus: wasteAcceptationStatus,
    wasteRefusalReason: "Non conforme",
    quantityReceived: 21.3
  },
  updatedFields: [
    "wasteAcceptationStatus",
    "wasteRefusalReason",
    "quantityReceived"
  ],
  mutation: "UPDATED",
  previousValues: {
    id: "xyz12345",
    createdAt: "2019-10-16T07:45:13.959Z",
    updatedAt: "2019-10-16T07:45:13.959Z"
  }
});

// entreprise.data.gouv responses, giving 66 and 77 departements for companies involved in the form
const insee1 = {
  siret: "12346084400013",
  siren: "123460844",
  name: "Dechet Factory SA",
  naf: "123",
  libelleNaf: "Fabricant de déchets",
  address: "01 Rue Marie Curie 66000 Laville",
  longitude: "1",
  latitude: "1",
  departement: "66"
};
const insee2 = {
  siret: "12346085500055",
  siren: "484960855",
  name: "Dechet processor SA",
  naf: "345",
  libelleNaf: "Traitement de déchets",
  address: "rue de la Paix, 77000 Une ville",
  longitude: "2",
  latitude: "2",
  departement: "77"
};

// Mock pdf service
jest.mock("../../forms/pdf", () => ({
  pdfEmailAttachment: jest.fn(() => "base64xyz")
}));
// Mock a utils function that hits th db
jest.mock("../../companies/queries", () => ({
  getCompanyAdminUsers: jest.fn(() => mockedCompanyAdmins)
}));

// Mock prima DB
jest.mock("../../generated/prisma-client", () => ({
  prisma: {
    form: jest.fn(() => mockedForm)
  }
}));

const { MJ_MAIN_TEMPLATE_ID } = process.env;
/**
 * Test mailWhenFormIsDeclined function
 * We check:
 *    td-insee is called twice
 *    td-mail is called 3 times with right params
 *    dreals from relevant departments are emailed
 *
 */
describe("mailWhenFormIsDeclined", () => {
  // tweak and restore process.env after each test
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); //   clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should send mails if waste is refused", async () => {
    process.env.NOTIFY_DREAL_WHEN_FORM_DECLINED = "true";
    // spies on axios get and post methods
    const mockedAxiosGet = jest.spyOn(axios, "get");
    const mockedAxiosPost = jest.spyOn(axios, "post");
    (mockedAxiosGet as jest.Mock<any>)
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: insee1
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: insee2
        })
      );
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    await mailWhenFormIsDeclined(formPayload("REFUSED"));

    // get called twice for td-insee
    expect(mockedAxiosGet as jest.Mock<any>).toHaveBeenCalledTimes(2);

    // post called 3 times for mail sending
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(3);

    const args = mockedAxiosPost.mock.calls;
    // right service was called

    expect(args[0][0]).toEqual("http://td-mail/send");
    expect(args[1][0]).toEqual("http://td-mail/send");
    expect(args[2][0]).toEqual("http://td-mail/send");

    let payload1 = args[0][1];
    let payload2 = args[1][1];
    let payload3 = args[2][1];

    // pdf from was attached
    expect(payload1.attachment).toEqual("base64xyz");
    expect(payload2.attachment).toEqual("base64xyz");
    expect(payload3.attachment).toEqual("base64xyz");

    // we have 3 recipients, emitter and 2 dreals matching 66 and 77 depts
    expect(payload1.to[0].email).toEqual("producer@example.com");
    expect(payload2.to[0].email).toEqual(
      "uid-11-66.dreal-occitanie@developpement-durable.gouv.fr"
    );
    expect(payload3.to[0].email).toEqual(
      "ud77.driee-if@developpement-durable.gouv.fr"
    );

    // check form readable id is in mail body
    expect(payload1.body).toContain("TD-19-AAA03488");
    expect(payload2.body).toContain("TD-19-AAA03488");
    expect(payload3.body).toContain("TD-19-AAA03488");

    const templateId = parseInt(MJ_MAIN_TEMPLATE_ID, 10);
    expect(payload1.templateId).toEqual(templateId);
    expect(payload2.templateId).toEqual(templateId);
    expect(payload3.templateId).toEqual(templateId);

    mockedAxiosPost.mockReset(); // removes calls, instances, returned values and implementations
    mockedAxiosGet.mockReset(); // removes calls, instances, returned values and implementations
  });

  it("should send mails if waste is partially refused", async () => {
    process.env.NOTIFY_DREAL_WHEN_FORM_DECLINED = "true";
    // spies on axios get and post methods
    const mockedAxiosGet = jest.spyOn(axios, "get");
    const mockedAxiosPost = jest.spyOn(axios, "post");
    (mockedAxiosGet as jest.Mock<any>)
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: insee1
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: insee2
        })
      );
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    await mailWhenFormIsDeclined(formPayload("PARTIALLY_REFUSED"));

    // get called twice for td-insee
    expect(mockedAxiosGet as jest.Mock<any>).toHaveBeenCalledTimes(2);

    // post called 3 times for mail sending
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(3);

    const args = mockedAxiosPost.mock.calls;
    // right service was called

    expect(args[0][0]).toEqual("http://td-mail/send");
    expect(args[1][0]).toEqual("http://td-mail/send");
    expect(args[2][0]).toEqual("http://td-mail/send");

    let payload1 = args[0][1];
    let payload2 = args[1][1];
    let payload3 = args[2][1];

    // pdf from was attached
    expect(payload1.attachment).toEqual("base64xyz");
    expect(payload2.attachment).toEqual("base64xyz");
    expect(payload3.attachment).toEqual("base64xyz");

    // we have 3 recipients, emitter and 2 dreals matching 66 and 77 depts
    expect(payload1.to[0].email).toEqual("producer@example.com");
    expect(payload2.to[0].email).toEqual(
      "uid-11-66.dreal-occitanie@developpement-durable.gouv.fr"
    );
    expect(payload3.to[0].email).toEqual(
      "ud77.driee-if@developpement-durable.gouv.fr"
    );

    // check form readable id is in mail body
    expect(payload1.body).toContain("TD-19-AAA03488");
    expect(payload2.body).toContain("TD-19-AAA03488");
    expect(payload3.body).toContain("TD-19-AAA03488");

    const templateId = parseInt(MJ_MAIN_TEMPLATE_ID, 10);
    expect(payload1.templateId).toEqual(templateId);
    expect(payload2.templateId).toEqual(templateId);
    expect(payload3.templateId).toEqual(templateId);

    mockedAxiosPost.mockReset(); // removes calls, instances, returned values and implementations
    mockedAxiosGet.mockReset(); // removes calls, instances, returned values and implementations
  });
});
