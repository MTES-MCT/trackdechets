import { ValidationError } from "yup";
import { siretify } from "../../__tests__/factories";
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
      transportSignature: true
    });
  });
  it("should not validate without recipisse when it's a foreign transport", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        transporterCompanySiret: siretify(1),
        transporterCompanyName: "transporteur FR"
      }
    });
    delete bsvhu.transporterRecepisseDepartment;
    delete bsvhu.transporterRecepisseNumber;
    await expect(() =>
      validateBsvhu(bsvhu, {
        transportSignature: true
      })
    ).rejects.toThrow(ValidationError);
  });
});
