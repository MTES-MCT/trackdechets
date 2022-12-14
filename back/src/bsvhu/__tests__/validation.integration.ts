import { CompanyType } from "@prisma/client";
import { ValidationError } from "yup";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { validateBsvhu } from "../validation";

import { bsvhuFactory } from "./factories.vhu";

describe("BSVHU validation", () => {
  afterAll(resetDatabase);

  it("should validate without recipisse when it's a foreign transport", async () => {
    const transporter = await companyFactory({
      companyTypes: [CompanyType.TRANSPORTER],
      vatNumber: "BE0541696005",
      siret: "BE0541696005"
    });
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTE_VEHICLES]
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        transporterCompanyVatNumber: transporter.vatNumber,
        transporterCompanySiret: null,
        transporterCompanyName: transporter.name,
        destinationCompanySiret: destination.siret
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
        transporterCompanySiret: "12345678901234",
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
