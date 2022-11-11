import { validateBsvhu } from "../validation";

import { bsvhuFactory } from "./factories.vhu";

describe("BSVHU validation", () => {
  it("should validate without recipisse when it's a foreign transport", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        transporterCompanyVatNumber: "BE0541696005",
        transporterCompanyName: "transporteur BE"
      }
    });
    delete bsvhu.transporterRecepisseDepartment;
    delete bsvhu.transporterRecepisseNumber;

    await validateBsvhu(bsvhu, {
      emissionSignature: true
    });
  });
});
