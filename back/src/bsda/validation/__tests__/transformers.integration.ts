import { runTransformers } from "../transformers";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { bsdaFactory } from "../../__tests__/factories";
import prisma from "../../../prisma";

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
        transporterRecepisseNumber: receipt.receiptNumber,
        transporterRecepisseDepartment: receipt.department,
        transporterRecepisseValidityLimit: receipt.validityLimit
      });
    });

    it("runTransformers should remove receipt from BSDA when TransporterReceipt does not exist", async () => {
      const company = await companyFactory();
      const bsda = await bsdaFactory({
        opt: {
          transporterCompanySiret: company.siret,
          transporterCompanyVatNumber: company.vatNumber,
          transporterRecepisseIsExempted: false
        }
      });

      expect(bsda.transporterRecepisseNumber).toBeDefined();

      const transporterReceipt = await prisma.company
        .findFirst({ where: { siret: bsda.transporterCompanySiret } })
        .transporterReceipt();

      expect(transporterReceipt).not.toBeNull();

      await prisma.transporterReceipt.delete({
        where: { id: transporterReceipt?.id }
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
