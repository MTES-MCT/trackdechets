const {
  processMainFormParams,
  processSegment,
  dateFmt
} = require("../helpers");

describe("processMainFormParams", () => {
  it("should format the fields", () => {
    const params = {
      transporterCompanySiret: "0".repeat(14),
      transporterValidityLimit: new Date("01/01/2020").toISOString(),
      traderValidityLimit: new Date("01/02/2020").toISOString(),
      recipientCompanySiret: "recipient-company-siret",
      recipientCompanyName: "RECIPIENT COMPANY NAME",
      recipientCompanyAddress: "Recipient Company Address",
      recipientCompanyContact: "RECIPIENT Contact",
      sentAt: new Date("01/05/2020").toISOString(),
      sentBy: "SENT By",
      receivedAt: new Date("01/06/2020").toISOString(),
      signedAt: new Date("01/06/2020").toISOString(),
      receivedBy: "RECEIVED By",
      processedAt: new Date("01/07/2020").toISOString(),
      tempStorerReceivedAt: new Date("01/03/2020").toISOString(),
      tempStorerSignedAt: new Date("01/04/2020").toISOString(),
      signedBy: "SIGNED By"
    };

    expect(processMainFormParams(params)).toMatchObject({
      recipientCompanySiret10: params.recipientCompanySiret,
      recipientCompanyName10: params.recipientCompanyName,
      recipientCompanyAddress10: params.recipientCompanyAddress,
      recipientCompanyContact10: params.recipientCompanyContact,
      senderSentBy: params.sentBy,
      receivedBy10: params.receivedBy,
      tempStoredFormSignedBy: params.signedBy,
      transporterSentAt: dateFmt(params.sentAt),
      transporterValidityLimit: dateFmt(params.transporterValidityLimit),
      traderValidityLimit: dateFmt(params.traderValidityLimit),
      tempStorerReceivedAt: dateFmt(params.tempStorerReceivedAt),
      tempStorerSignedAt: dateFmt(params.tempStorerSignedAt),
      senderSentAt: dateFmt(params.sentAt),
      receivedAt: dateFmt(params.receivedAt),
      processedAt: dateFmt(params.processedAt),
      signedAt: dateFmt(params.signedAt),
      tempStoredFormSignedAt: dateFmt(params.signedAt)
    });
  });
});

describe("processSegment", () => {
  it("should format the fields", () => {
    const params = {
      transporterCompanySiret: "0".repeat(14),
      transporterValidityLimit: new Date("01/01/2020").toISOString()
    };

    expect(processSegment(params)).toMatchObject({
      transporterValidityLimit: dateFmt(params.transporterValidityLimit)
    });
  });
});
