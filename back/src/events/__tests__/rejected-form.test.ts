import { Form } from "@prisma/client";
import axios from "axios";
import * as search from "../../companies/search";
import { TDEventPayload } from "../emitter";
import { mailWhenFormIsDeclined } from "../forms";
import * as mailing from "../../mailer/mailing";
import templateIds from "../../mailer/templates/provider/templateIds";
import { CompanySearchResult } from "../../companies/types";

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
  transporterDepartment: "83",
  emitterWorkSitename: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  recipientCap: "",
  emitterCompanyPhone: "06 12 45 56 78",
  emitterCompanyMail: "producer@example.com",
  receivedBy: "john",
  transporterCompanySiret: "12346084400013",
  processingOperationDescription: null,
  transporterCompanyAddress: "01 Rue Marie Curie 66000 Laville",
  nextDestinationProcessingOperation: null,
  nextDestinationCompanyAddress: null,
  nextDestinationCompanyPhone: null,
  nextDestinationCompanyMail: null,
  nextDestinationCompanyContact: null,
  nextDestinationCompanySiret: null,
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
  signedAt: "2019-10-16T00:00:00.000Z",
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-10-16T00:00:00.000Z",
  traderCompanySiret: "",
  transporterNumberPlate: "1",
  recipientProcessingOperation: "D 3",
  wasteDetailsPackagingInfos: [{ type: "BENNE", quantity: 1 }],
  transporterValidityLimit: "2099-10-18T00:00:00.000Z",
  emitterCompanyContact: "aa",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED",
  transporterCompanyPhone: "06 18 76 02 96",
  recipientCompanyMail: "recipient@example.com",
  wasteDetailsConsistence: "SOLID",
  wasteDetailsPop: false,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "12343606600011",
  processingOperationDone: null,
  readableId: "BSD-20210101-AAAAAAAA",
  recipientCompanyName: "Dechet processor SA",
  wasteAcceptationStatus: "REFUSED"
};

const mockedCompanyAdmins = {
  "12343606600011": [
    {
      name: "Eric",
      email: "producer@example.com",
      id: "qsd678",
      isActive: true,
      phone: "06 18 33 22 33"
    }
  ],
  "12346084400013": [
    {
      name: "Henry",
      email: "recipient@example.com",
      id: "qsd678",
      isActive: true,
      phone: "06 18 33 22 33"
    }
  ]
};

const formPayload = (wasteAcceptationStatus): TDEventPayload<Form> => ({
  node: {
    id: "xyz12345",
    readableId: "BSD-20210101-AAAAAAAA",
    isImportedFromPaper: false,
    status: "REFUSED",
    createdAt: new Date("2019-10-16T07:45:13.959Z"),
    updatedAt: new Date("2019-10-16T07:45:13.959Z"),
    wasteAcceptationStatus,
    wasteRefusalReason: "Non conforme",
    quantityReceived: 21.3,
    wasteDetailsPop: false
  } as Form,
  updatedFields: {
    wasteAcceptationStatus: "<a value>",
    wasteRefusalReason: "<a value>",
    quantityReceived: "<a value>"
  },
  mutation: "UPDATED",
  previousNode: {
    id: "xyz12345",
    readableId: "BSD-20210101-AAAAAAAA",
    isImportedFromPaper: false,
    status: "SENT",
    createdAt: new Date("2019-10-16T07:45:13.959Z"),
    updatedAt: new Date("2019-10-16T07:45:13.959Z"),
    wasteDetailsPop: false
  } as Form
});

// search SIRENE responses, giving 66 and 77 departements for companies involved in the form
const insee1: CompanySearchResult = {
  siret: "12346084400013",
  name: "Dechet Factory SA",
  naf: "123",
  libelleNaf: "Fabricant de déchets",
  address: "01 Rue Marie Curie 66480 Laville",
  addressVoie: "01 Rue Marie Curie",
  addressPostalCode: "66480",
  addressCity: "Laville",
  codeCommune: "66001",
  isRegistered: true
};
const insee2: CompanySearchResult = {
  siret: "12346085500055",
  name: "Dechet processor SA",
  naf: "345",
  libelleNaf: "Traitement de déchets",
  address: "rue de la Paix, 77760 Une ville",
  addressVoie: "rue de la Paix",
  addressPostalCode: "77760",
  addressCity: "Une ville",
  codeCommune: "77001",
  isRegistered: true
};

// Mock pdf generator
jest.mock("../../forms/pdf", () => ({
  generateBsddPdfToBase64: jest.fn(() => "base64xyz")
}));

// Mock a utils function that hits th db
jest.mock("../../companies/database", () => ({
  getCompanyAdminUsers: jest.fn(siret => mockedCompanyAdmins[siret])
}));

// Mock prima DB
jest.mock("../../prisma", () => ({
  form: { findUnique: jest.fn(() => mockedForm) }
}));

// spies on searchCompany to capture calls to entreprise.data.gouv.fr
const searchCompanySpy = jest.spyOn(search, "searchCompany");
// spies on axios get to capture calls to geo.api.gouv.fr
const mockedAxiosGet = jest.spyOn(axios, "get");
// spies on axios post to capture calls to mail helpers
const mockedAxiosPost = jest.spyOn(axios, "post");
const mockedSendMail = jest.spyOn(mailing, "sendMail");

/**
 * Test mailWhenFormIsDeclined function
 * We check:
 *    searchCompany is called twice
 *    geo.api.gouv.fr is called twice
 *    mail helper is called 3 times with right params
 *    dreals from relevant departments are emailed
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
    searchCompanySpy.mockReset(); // removes calls, instances, returned values and implementations
    mockedAxiosPost.mockReset(); // removes calls, instances, returned values and implementations
    mockedAxiosGet.mockReset(); // removes calls, instances, returned values and implementations
    mockedSendMail.mockReset();
  });

  it("should send mails if waste is refused", async () => {
    process.env.NOTIFY_DREAL_WHEN_FORM_DECLINED = "true";

    searchCompanySpy
      .mockResolvedValueOnce(insee1)
      .mockResolvedValueOnce(insee2);

    (mockedAxiosGet as jest.Mock<any>)
      .mockResolvedValueOnce({ data: { codeDepartement: "66" } })
      .mockResolvedValueOnce({ data: { codeDepartement: "77" } });
    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );
    (mockedSendMail as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve()
    );
    await mailWhenFormIsDeclined(formPayload("REFUSED"));

    // get called twice for entreprise.data.gouv.fr
    expect(searchCompanySpy).toHaveBeenCalledTimes(2);

    // get called twice for geo.api.gouv.fr
    expect(mockedAxiosGet as jest.Mock<any>).toHaveBeenCalledTimes(2);

    // post called 1 time for mail sending
    expect(mockedSendMail as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const args = mockedSendMail.mock.calls;

    const payload1 = args[0][0];

    // pdf from was attached
    expect(payload1.attachment.file).toEqual("base64xyz");

    // we have 3 recipients, emitter and 2 dreals matching 66 and 77 depts
    expect(payload1.to[0].email).toEqual("producer@example.com");
    expect(payload1.cc[0].email).toEqual("recipient@example.com");
    expect(payload1.cc[1].email).toEqual(
      "uid-11-66.dreal-occitanie@developpement-durable.gouv.fr"
    );
    expect(payload1.cc[2].email).toEqual(
      "ud77.driee-if@developpement-durable.gouv.fr"
    );

    // check form readable id is in mail body
    expect(payload1.body).toContain("BSD-20210101-AAAAAAAA");

    expect(payload1.templateId).toEqual(templateIds.LAYOUT);
  });

  it("should send mails if waste is partially refused", async () => {
    process.env.NOTIFY_DREAL_WHEN_FORM_DECLINED = "true";

    searchCompanySpy
      .mockResolvedValueOnce(insee1)
      .mockResolvedValueOnce(insee2);

    // spies on axios get and post methods
    (mockedAxiosGet as jest.Mock<any>)
      .mockResolvedValueOnce({ data: { codeDepartement: "66" } })
      .mockResolvedValueOnce({ data: { codeDepartement: "77" } });

    (mockedAxiosPost as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve({
        data: { result: "ok" }
      })
    );

    (mockedSendMail as jest.Mock<any>).mockImplementation(() =>
      Promise.resolve()
    );
    await mailWhenFormIsDeclined(formPayload("PARTIALLY_REFUSED"));

    // get called 2 times for entreprise.data.gouv.fr
    expect(searchCompanySpy).toHaveBeenCalledTimes(2);

    // get called 2 times for geo.api.gouv.fr
    expect(mockedAxiosGet as jest.Mock<any>).toHaveBeenCalledTimes(2);

    // post called 1 time for mail sending
    expect(mockedSendMail as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const args = mockedSendMail.mock.calls;

    // right service was called

    const payload1 = args[0][0];

    // pdf from was attached
    expect(payload1.attachment.file).toEqual("base64xyz");

    // we have 3 recipients, emitter and 2 dreals matching 66 and 77 depts
    expect(payload1.to[0].email).toEqual("producer@example.com");
    expect(payload1.cc[0].email).toEqual("recipient@example.com");
    expect(payload1.cc[1].email).toEqual(
      "uid-11-66.dreal-occitanie@developpement-durable.gouv.fr"
    );
    expect(payload1.cc[2].email).toEqual(
      "ud77.driee-if@developpement-durable.gouv.fr"
    );

    // check form readable id is in mail body
    expect(payload1.body).toContain("BSD-20210101-AAAAAAAA");

    expect(payload1.templateId).toEqual(templateIds.LAYOUT);
  });
});
