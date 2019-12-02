const supertest = require("supertest");

const app = require("../app");

const request = supertest(app);
const testData = {
  wasteDetailsQuantity: 1.32,
  signedByTransporter: null,
  emitterCompanyName: "EMETTEUR SARL",
  transporterCompanyName: "TRANSPORTER_SAS",
  traderCompanyAddress: "",
  transporterReceipt: "2018-123",
  quantityReceived: null,
  updatedAt: "2019-09-23T15:02:28.331Z",
  processedAt: null,
  wasteDetailsOnuCode:
    "UN 2794, DECHET, ACCUMULATEURS électriques REMPLIS D'ÉLECTROLYTE LIQUIDE ACIDE,  8,  , (E)",
  emitterType: "PRODUCER",
  traderValidityLimit: null,
  traderCompanyContact: "",
  wasteDetailsCode: "16 06 01*",
  processedBy: null,
  recipientCompanyAddress: "ZA INDUSTRIE 75000 PARIS",
  nextDestinationDetails: null,
  transporterDepartment: "38",
  emitterPickupSite: "",
  recipientCap: "20/00CL000172/000BAT_XYZ/000",
  emitterCompanyPhone: "04 12 34 56 78",
  isAccepted: null,
  emitterCompanyMail: "emitter@example.fr",
  wasteDetailsOtherPackaging: "",
  receivedBy: null,
  transporterCompanySiret: "3330300731234",
  processingOperationDescription: null,
  transporterCompanyAddress: "ZA INDUSTRIE 75000 PARIS",
  nextDestinationProcessingOperation: null,
  recipientCompanyPhone: "04 12 34 56 89",
  traderCompanyName: "",
  id: "XYZ",
  isDeleted: false,
  transporterCompanyContact: "P DUPONT",
  traderCompanyMail: "",
  emitterCompanyAddress: "CAP 38 ZAC des Iles 38120 SAINT EGREVE",
  sentBy: null,
  status: "SEALED",
  createdAt: "2019-07-25T17:29:10.336Z",
  recipientCompanySiret: "33300007300001",
  transporterCompanyMail: "transporter@example.fr",
  wasteDetailsName: "Batteries Plomb",
  traderDepartment: "",
  recipientCompanyContact: "Paul Martin",
  receivedAt: null,
  transporterIsExemptedOfReceipt: null,
  sentAt: null,
  traderCompanySiret: "",
  transporterNumberPlate: "",
  recipientProcessingOperation: "D13",
  wasteDetailsPackagings: ["GRV"],
  transporterValidityLimit: "2023-05-08T22:00:00.000Z",
  emitterCompanyContact: "CARINE",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED",
  transporterCompanyPhone: "04 01 23 45 67",
  recipientCompanyMail: "recipient@example.fr",
  wasteDetailsConsistence: "SOLID",
  wasteDetailsNumberOfPackages: 2,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "48047015201564",
  processingOperationDone: null,
  readableId: "TD-19-AAA00123",
  recipientCompanyName: "RECIPIENT SAS",
  appendix2Forms: []
};

test("server answers to ping request", async () => {
  const res = await request.get("/ping");
  expect(res.status).toBe(200);
  expect(res.text).toBe("pong");
});

test("server renders pdf", async () => {
  const res = await request.post("/pdf").send(testData);

  expect(res.status).toBe(200);
  const { headers } = res;
  expect(headers["content-type"]).toBe("application/pdf");
  const date = new Date();
  const fileNameSuffix = `${date.getDate()}-${date.getMonth() +
    1}-${date.getFullYear()}`;

  expect(headers["content-disposition"]).toBe(
    `attachment;filename=BSD_TD-19-AAA00123_${fileNameSuffix}.pdf`
  );
});
//
