import { runTransformers } from "../transformers";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { bspaohFactory } from "../../__tests__/factories";

describe("BSPAOH Zod transformers", () => {
  describe("recipisseTransporterTransformer", () => {
    it("runTransformers should correctly process input and return completedInput with transporter receipt", async () => {
      const company = await companyFactory();
      const receipt = await transporterReceiptFactory({ company });
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: company.siret,

              transporterCompanyVatNumber: company.vatNumber,

              transporterRecepisseIsExempted: false,
              transporterRecepisseNumber: null,
              transporterRecepisseDepartment: null,
              transporterRecepisseValidityLimit: null,
              number: 1
            }
          }
        }
      });

      const completedInput = await runTransformers(
        { ...bspaoh, ...bspaoh.transporters[0] } as any,
        []
      ); // flatten first transporter

      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: receipt.receiptNumber,
        transporterRecepisseDepartment: receipt.department,
        transporterRecepisseValidityLimit: receipt.validityLimit
      });
    });

    it("runTransformers should remove receipt from BSPAOH when TransporterReceipt does not exist", async () => {
      const company = await companyFactory();
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              transporterCompanyVatNumber: company.vatNumber,
              transporterRecepisseIsExempted: false,
              transporterRecepisseNumber: "null",
              transporterRecepisseDepartment: "42",
              transporterRecepisseValidityLimit: new Date(),
              number: 1
            }
          }
        }
      });

      const completedInput = await runTransformers(
        { ...bspaoh, ...bspaoh.transporters[0] } as any,
        []
      );
      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });

    it("runTransformers should correctly process Input with isExempted true and return completedInput without transporter recepisse", async () => {
      const company = await companyFactory();
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              transporterCompanyVatNumber: company.vatNumber,
              transporterRecepisseIsExempted: true,
              transporterRecepisseNumber: null,
              transporterRecepisseDepartment: null,
              transporterRecepisseValidityLimit: null,
              number: 1
            }
          }
        }
      });

      const completedInput = await runTransformers(
        { ...bspaoh, ...bspaoh.transporters[0] } as any,
        []
      );
      expect(completedInput).toMatchObject({
        transporterRecepisseIsExempted: true,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      });
    });
  });
});
