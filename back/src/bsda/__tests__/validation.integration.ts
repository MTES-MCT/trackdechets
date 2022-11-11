import { validateBsda } from "../validation";

import { bsdaFactory } from "./factories";

describe("BSDA validation", () => {
  it("should validate without recipisse when it's a foreign transport", async () => {
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanyVatNumber: "BE0541696005",
        transporterCompanyName: "transporteur BE"
      }
    });
    delete bsda.transporterRecepisseDepartment;
    delete bsda.transporterRecepisseNumber;
    delete bsda.transporterRecepisseIsExempted;

    await validateBsda(bsda, [], {
      emissionSignature: true
    });
  });
});
