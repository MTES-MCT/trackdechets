import { FormWithTempStorageFlattened } from "../types";
import { sortFormKeys, formatForm, labelizeForm } from "../transformers";

test("sortFormKeys", () => {
  const form: FormWithTempStorageFlattened = {
    wasteDetailsQuantity: 22.5,
    emitterCompanyName: "WASTE PRODUCER",
    emitterWorkSiteAddress: "",
    emitterWorkSiteName: "",
    wasteDetailsCode: "06 01 01*",
    recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
    isAccepted: null,
    customId: null,
    emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
    recipientCompanySiret: "5678",
    receivedAt: null,
    sentAt: "2020-03-01T00:00:00.000Z",
    transporterNumberPlate: "aa22",
    recipientProcessingOperation: "D 6",
    emitterCompanyContact: "Marc Martin",
    recipientCompanyMail: "recipient@td.io",
    emitterCompanySiret: "1234",
    readableId: "TD-8865a853b7da51b9789db6ada3ef8bee",
    recipientCompanyName: "WASTE COMPANY"
  };

  const sorted = sortFormKeys(form);

  expect(sorted).toEqual({
    readableId: form.readableId,
    customId: form.customId,
    emitterCompanySiret: form.emitterCompanySiret,
    emitterCompanyName: form.emitterCompanyName,
    emitterCompanyContact: form.emitterCompanyContact,
    emitterCompanyAddress: form.emitterCompanyAddress,
    emitterWorkSiteName: form.emitterWorkSiteName,
    emitterWorkSiteAddress: form.emitterWorkSiteAddress,
    recipientCompanySiret: form.recipientCompanySiret,
    recipientCompanyName: form.recipientCompanyName,
    recipientCompanyAddress: form.recipientCompanyAddress,
    recipientCompanyMail: form.recipientCompanyMail,
    recipientProcessingOperation: form.recipientProcessingOperation,
    wasteDetailsCode: form.wasteDetailsCode,
    wasteDetailsQuantity: form.wasteDetailsQuantity,
    transporterNumberPlate: form.transporterNumberPlate,
    sentAt: form.sentAt,
    receivedAt: form.receivedAt,
    isAccepted: form.isAccepted
  });
});

test("formatForm", () => {
  const form: FormWithTempStorageFlattened = {
    readableId: "TD-8865a853b7da51b9789db6ada3ef8bee",
    traderValidityLimit: "",
    sentAt: "2020-03-02T00:00:00.000Z",
    receivedAt: "2020-03-01T00:00:00.000Z",
    isAccepted: true,
    noTraceability: false
  };

  const formatted = formatForm(form);
  expect(formatted).toEqual({
    readableId: form.readableId,
    traderValidityLimit: "",
    sentAt: "2020-03-02",
    receivedAt: "2020-03-01",
    isAccepted: "O",
    noTraceability: "N"
  });
});

test("labelizeForm", () => {
  const form = {
    readableId: "TD-8865a853b7da51b9789db6ada3ef8bee"
  };
  const labelized = labelizeForm(form);
  expect(labelized).toEqual({ "N° de bordereau": form.readableId });
});
