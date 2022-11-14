import { ValidationError } from "yup";
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
      transportSignature: true
    });
  });

  it("should not validate without recipisse when it's a french transport", async () => {
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: "12345678901234",
        transporterCompanyName: "transporteur FR"
      }
    });
    delete bsda.transporterRecepisseDepartment;
    delete bsda.transporterRecepisseNumber;
    await expect(() =>
      validateBsda(bsda, [], {
        transportSignature: true
      })
    ).rejects.toThrow(ValidationError);
  });
});
