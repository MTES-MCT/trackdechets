import { getTransporterCompanyOrgId } from "@td/constants";
import { getSealedFields } from "./rules";
import { ParsedZodBsvhu } from "./schema";
import { BsvhuValidationContext, ZodBsvhuTransformer } from "./types";
import { CompanyRole } from "../../common/validation/zod/schema";
import { buildRecipify, RecipifyInputAccessor } from "../../companies/recipify";

const recipifyBsvhuAccessors = (
  bsd: ParsedZodBsvhu,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ParsedZodBsvhu>[] => [
  {
    role: CompanyRole.Transporter,
    skip:
      bsd.transporterRecepisseIsExempted ||
      sealedFields.includes("transporterRecepisseNumber"),
    orgIdGetter: () => {
      const orgId = getTransporterCompanyOrgId({
        transporterCompanySiret: bsd.transporterCompanySiret ?? null,
        transporterCompanyVatNumber: bsd.transporterCompanyVatNumber ?? null
      });
      return orgId ?? null;
    },
    setter: async (bsvhu: ParsedZodBsvhu, receipt) => {
      bsvhu.transporterRecepisseNumber = receipt?.receiptNumber ?? null;
      bsvhu.transporterRecepisseValidityLimit = receipt?.validityLimit ?? null;
      bsvhu.transporterRecepisseDepartment = receipt?.department ?? null;
    }
  },
  {
    role: CompanyRole.Broker,
    skip: sealedFields.includes("brokerRecepisseNumber"),
    orgIdGetter: () => {
      return bsd.brokerCompanySiret ?? null;
    },
    setter: async (bsvhu: ParsedZodBsvhu, receipt) => {
      // don't overwrite user input because there are still those inputs in BSVHU forms
      if (!bsvhu.brokerRecepisseNumber && receipt?.receiptNumber) {
        bsvhu.brokerRecepisseNumber = receipt.receiptNumber;
      }
      if (!bsvhu.brokerRecepisseValidityLimit && receipt?.validityLimit) {
        bsvhu.brokerRecepisseValidityLimit = receipt.validityLimit;
      }
      if (!bsvhu.brokerRecepisseDepartment && receipt?.department) {
        bsvhu.brokerRecepisseDepartment = receipt.department;
      }
    }
  },
  {
    role: CompanyRole.Trader,
    skip: sealedFields.includes("traderRecepisseNumber"),
    orgIdGetter: () => {
      return bsd.traderCompanySiret ?? null;
    },
    setter: async (bsvhu: ParsedZodBsvhu, receipt) => {
      // don't overwrite user input because there are still those inputs in BSVHU forms
      if (!bsvhu.traderRecepisseNumber && receipt?.receiptNumber) {
        bsvhu.traderRecepisseNumber = receipt.receiptNumber;
      }
      if (!bsvhu.traderRecepisseValidityLimit && receipt?.validityLimit) {
        bsvhu.traderRecepisseValidityLimit = receipt.validityLimit;
      }
      if (!bsvhu.traderRecepisseDepartment && receipt?.department) {
        bsvhu.traderRecepisseDepartment = receipt.department;
      }
    }
  }
];

export const recipifyBsvhu: (
  context: BsvhuValidationContext
) => ZodBsvhuTransformer = context => {
  return async bsvhu => {
    console.log("RECIPIFY");
    const sealedFields = await getSealedFields(bsvhu, context);
    const accessors = recipifyBsvhuAccessors(bsvhu, sealedFields);
    return buildRecipify(accessors, bsvhu);
  };
};
