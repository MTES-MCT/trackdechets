const { processMainFormParams, dateFmt } = require("../helpers");

function createParams(params) {
  return {
    transporterCompanySiret: "0".repeat(14),
    ...params,
  };
}

describe("processMainFormParams", () => {
  it("should format the dates", () => {
    const transporterValidityLimit = new Date("01/01/2020");
    const traderValidityLimit = new Date("01/02/2020");
    const tempStorerReceivedAt = new Date("01/03/2020");
    const tempStorerSignedAt = new Date("01/04/2020");
    const sentAt = new Date("01/05/2020");
    const receivedAt = new Date("01/06/2020");
    const processedAt = new Date("01/07/2020");

    const params = processMainFormParams(
      createParams({
        transporterValidityLimit,
        traderValidityLimit,
        tempStorerReceivedAt,
        tempStorerSignedAt,
        sentAt,
        receivedAt,
        processedAt,
      })
    );

    expect(params).toMatchObject({
      transporterValidityLimit: dateFmt(transporterValidityLimit),
      traderValidityLimit: dateFmt(traderValidityLimit),
      tempStorerReceivedAt: dateFmt(tempStorerReceivedAt),
      tempStorerSignedAt: dateFmt(tempStorerSignedAt),
      senderSentAt: dateFmt(sentAt),
      receivedAt: dateFmt(receivedAt),
      processedAt: dateFmt(processedAt),
    });
  });
});
