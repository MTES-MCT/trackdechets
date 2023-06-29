import { recipify } from "../recipify";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { bsdaFactory } from "../../__tests__/factories";

describe("Bsda Recipify Module", () => {
  it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const receipt = await transporterReceiptFactory({ company });
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: company.siret,
        transporterCompanyVatNumber: company.vatNumber,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      }
    });

    const completedInput = await recipify(bsda, false);
    expect(completedInput).toMatchObject({
      transporterRecepisseIsExempted: false,
      transporterRecepisseNumber: receipt.receiptNumber,
      transporterRecepisseDepartment: receipt.department,
      transporterRecepisseValidityLimit: receipt.validityLimit
    });
  });

  it("recipify should correctly process Input with isExempted true and return completedInput without transporter recepisse", async () => {
    const company = await companyFactory();
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: company.siret,
        transporterCompanyVatNumber: company.vatNumber,
        transporterRecepisseIsExempted: true,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      }
    });

    const completedInput = await recipify(bsda, false);
    expect(completedInput).toMatchObject({
      transporterRecepisseIsExempted: true,
      transporterRecepisseNumber: null,
      transporterRecepisseDepartment: null,
      transporterRecepisseValidityLimit: null
    });
  });
});
