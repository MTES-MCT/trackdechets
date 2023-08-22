import { runTransformers } from "../transformers";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { bsdaFactory } from "../../__tests__/factories";

describe("BSDA Zod transformers", () => {
  describe("recipisseTransporterTransformer", () => {
    it("runTransformers should correctly process input and return completedInput with transporter receipt", async () => {
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

      const completedInput = await runTransformers(bsda as any, []);
      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: receipt.transporterReceiptNumber,
        transporterRecepisseDepartment: receipt.transporterReceiptDepartment,
        transporterRecepisseValidityLimit:
          receipt.transporterReceiptValidityLimit
      });
    });

    it("runTransformers should remove receipt from BSDA when TransporterReceipt does not exist", async () => {
      const company = await companyFactory();
      const bsda = await bsdaFactory({
        opt: {
          transporterCompanySiret: company.siret,
          transporterCompanyVatNumber: company.vatNumber,
          transporterRecepisseIsExempted: false,
          transporterRecepisseNumber: "null",
          transporterRecepisseDepartment: "42",
          transporterRecepisseValidityLimit: new Date()
        }
      });

      const completedInput = await runTransformers(bsda as any, []);
      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });
    it("runTransformers should correctly process Input with isExempted true and return completedInput without transporter recepisse", async () => {
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

      const completedInput = await runTransformers(bsda as any, []);
      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: true,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });
  });
});
