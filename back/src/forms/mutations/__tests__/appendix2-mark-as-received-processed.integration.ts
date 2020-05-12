import * as mailsHelper from "../../../common/mails.helper";

import { prepareRedis, prepareDB } from "../../__tests__/helpers";
import { userWithCompanyFactory } from "../../../__tests__/factories";

import makeClient from "../../../__tests__/testClient";

import {
  Consistence,
  EmitterType,
  QuantityType,
  Status,
  prisma
} from "../../../generated/prisma-client";

import { resetDatabase } from "../../../../integration-tests/helper";
import { getReadableId } from "../../readable-id";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const appendixFormData = {
  wasteDetailsQuantity: 10,
  signedByTransporter: true,
  emitterCompanyName: "WASTE PRODUCER",
  transporterCompanyName: "WASTE TRANSPORTER",
  traderCompanyAddress: "",
  transporterReceipt: "33AA",
  quantityReceived: null,
  processedAt: null,
  wasteDetailsOnuCode: "",
  emitterType: "PRODUCER" as EmitterType,
  traderValidityLimit: null,
  traderCompanyContact: "",
  wasteDetailsCode: "05 01 04*",
  processedBy: null,
  recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  transporterDepartment: "86",
  emitterWorkSiteName: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  recipientCap: "",
  emitterCompanyPhone: "06 18 76 02 96",
  isAccepted: true,
  emitterCompanyMail: "emitter@company.fr",
  wasteDetailsOtherPackaging: "",
  receivedBy: "Joe",
  transporterCompanySiret: "9876",
  processingOperationDescription: "regroupement",
  transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  nextDestinationProcessingOperation: null,
  nextDestinationCompanyAddress: null,
  nextDestinationCompanyPhone: null,
  nextDestinationCompanyMail: null,
  nextDestinationCompanyContact: null,
  nextDestinationCompanySiret: null,
  recipientCompanyPhone: "06 18 76 02 99",
  traderCompanyName: "",
  wasteAcceptationStatus: null,
  customId: null,
  isDeleted: false,
  transporterCompanyContact: "transporter",
  traderCompanyMail: "",
  emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
  sentBy: "signe",
  status: "GROUPED" as Status,
  wasteRefusalReason: "",
  recipientCompanySiret: "5678",
  transporterCompanyMail: "transporter@td.io",
  wasteDetailsName: "Divers",
  traderDepartment: "",
  recipientCompanyContact: "Jean Dupont",
  receivedAt: null,
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-11-20T00:00:00.000Z",
  traderCompanySiret: "",
  transporterNumberPlate: "aa22",
  recipientProcessingOperation: "D 15",
  wasteDetailsPackagings: ["CITERNE"],
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  emitterCompanyContact: "Marc Martin",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED" as QuantityType,
  transporterCompanyPhone: "06 18 76 02 66",
  recipientCompanyMail: "recipient@td.io",
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsNumberOfPackages: 1,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "1234",
  processingOperationDone: null,
  recipientCompanyName: "GROUPING COMPANY"
};

const groupingFormData = {
  wasteDetailsQuantity: 10,
  signedByTransporter: true,
  emitterCompanyName: "GROUPING COMPANY",
  transporterCompanyName: "WASTE TRANSPORTER",
  traderCompanyAddress: "",
  transporterReceipt: "33AA",
  quantityReceived: null,
  processedAt: null,
  wasteDetailsOnuCode: "",
  emitterType: "APPENDIX2" as EmitterType,
  traderValidityLimit: null,
  traderCompanyContact: "",
  wasteDetailsCode: "05 01 04*",
  processedBy: null,
  recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  transporterDepartment: "86",
  emitterWorkSiteName: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  recipientCap: "",
  emitterCompanyPhone: "06 18 76 02 96",
  isAccepted: true,
  emitterCompanyMail: "emitter@compnay.fr",
  wasteDetailsOtherPackaging: "",
  receivedBy: "Joe",
  transporterCompanySiret: "9876",
  processingOperationDescription: "regroupement",
  transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  nextDestinationProcessingOperation: null,
  nextDestinationCompanyAddress: null,
  nextDestinationCompanyPhone: null,
  nextDestinationCompanyMail: null,
  nextDestinationCompanyContact: null,
  nextDestinationCompanySiret: null,
  recipientCompanyPhone: "06 18 76 02 99",
  traderCompanyName: "",
  wasteAcceptationStatus: null,
  customId: null,
  isDeleted: false,
  transporterCompanyContact: "transporter",
  traderCompanyMail: "",
  emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
  sentBy: "sender",
  status: "SENT" as Status,
  wasteRefusalReason: "",
  recipientCompanySiret: "9999",
  transporterCompanyMail: "transporter@td.io",
  wasteDetailsName: "Divers",
  traderDepartment: "",
  recipientCompanyContact: "Jean Dupont",
  receivedAt: null,
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-11-20T00:00:00.000Z",
  traderCompanySiret: "",
  transporterNumberPlate: "aa22",
  recipientProcessingOperation: "D 15",
  wasteDetailsPackagings: ["CITERNE"],
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  emitterCompanyContact: "Marc Martin",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED" as QuantityType,
  transporterCompanyPhone: "06 18 76 02 66",
  recipientCompanyMail: "recipient@td.io",
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsNumberOfPackages: 1,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "1234",
  processingOperationDone: null,
  recipientCompanyName: "FINAL RECIPIENT"
};

describe("Test Form with appendix reception", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should mark a sent form with appendixes 2 as received", async () => {
    const { emitter, emitterCompany, recipientCompany } = await prepareDB();
    const {
      user: lastRecipient,
      company: lastRecipientCompany
    } = await userWithCompanyFactory("ADMIN");

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    // these forms are in "GROUPED" state
    let initialForm1 = await prisma.createForm({
      ...appendixFormData,
      readableId: await getReadableId(),
      owner: { connect: { id: emitter.id } }
    });
    let initialForm2 = await prisma.createForm({
      ...appendixFormData,
      readableId: await getReadableId(),
      owner: { connect: { id: emitter.id } }
    });

    // this form regroups both initialForms
    let formWithAppendix2 = await prisma.createForm({
      ...groupingFormData,
      readableId: await getReadableId(),
      recipientCompanySiret: lastRecipientCompany.siret,
      owner: { connect: { id: emitter.id } },
      appendix2Forms: {
        connect: [{ id: initialForm1.id }, { id: initialForm2.id }]
      }
    });

    const { mutate } = makeClient(lastRecipient);

    const mutation = `
      mutation {
        markAsReceived(
            id: "${formWithAppendix2.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 11
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    formWithAppendix2 = await prisma.form({ id: formWithAppendix2.id });
    initialForm1 = await prisma.form({ id: initialForm1.id });
    initialForm2 = await prisma.form({ id: initialForm2.id });

    expect(formWithAppendix2.status).toBe("RECEIVED");
    expect(initialForm1.status).toBe("PROCESSED");
    expect(initialForm2.status).toBe("PROCESSED");

    //   StatusLog objects are created
    const formWithAppendix2Logs = await prisma.statusLogs({
      where: { form: { id: formWithAppendix2.id } }
    });
    expect(formWithAppendix2Logs.length).toBe(1);
    expect(formWithAppendix2Logs[0].status).toBe("RECEIVED");
  });
});

describe("Test Form with appendix processing", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should mark a received form with appendixes 2 as processed", async () => {
    const { emitter, emitterCompany, recipientCompany } = await prepareDB();
    const {
      user: lastRecipient,
      company: lastRecipientCompany
    } = await userWithCompanyFactory("ADMIN");

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    // these forms are in "GROUPED" state
    let initialForm1 = await prisma.createForm({
      ...appendixFormData,
      readableId: await getReadableId(),
      status: "PROCESSED",
      owner: { connect: { id: emitter.id } }
    });
    let initialForm2 = await prisma.createForm({
      ...appendixFormData,
      readableId: await getReadableId(),
      status: "PROCESSED",
      owner: { connect: { id: emitter.id } }
    });

    // this form regroups both initialForms
    let formWithAppendix2 = await prisma.createForm({
      ...groupingFormData,
      readableId: await getReadableId(),
      recipientCompanySiret: lastRecipientCompany.siret,
      status: "RECEIVED",
      owner: { connect: { id: emitter.id } },
      appendix2Forms: {
        connect: [{ id: initialForm1.id }, { id: initialForm2.id }]
      }
    });

    const { mutate } = makeClient(lastRecipient);

    const mutation = `
    mutation   {
      markAsProcessed(id: "${formWithAppendix2.id}", processedInfo: {
        processingOperationDescription: "Une description",
        processingOperationDone: "D 1",
        processedBy: "A simple bot",
        processedAt: "2018-12-11T00:00:00.000Z"
      }) {
        id
      }
    }
  `;

    await mutate(mutation);

    formWithAppendix2 = await prisma.form({ id: formWithAppendix2.id });
    initialForm1 = await prisma.form({ id: initialForm1.id });
    initialForm2 = await prisma.form({ id: initialForm2.id });

    expect(formWithAppendix2.status).toBe("PROCESSED");
    expect(initialForm1.status).toBe("PROCESSED");
    expect(initialForm2.status).toBe("PROCESSED");

    // A StatusLog object is created
    const formWithAppendix2Logs = await prisma.statusLogs({
      where: { form: { id: formWithAppendix2.id } }
    });

    expect(formWithAppendix2Logs.length).toBe(1);
    expect(formWithAppendix2Logs[0].status).toBe("PROCESSED");
  });
});
