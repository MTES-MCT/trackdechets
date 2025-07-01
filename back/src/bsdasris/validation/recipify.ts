import { getTransporterCompanyOrgId } from "@td/constants";
import { ParsedZodBsdasri } from "./schema";
import { CompanyRole } from "../../common/validation/zod/schema";
import {
  buildRecipify,
  RecipifyInputAccessor
} from "../../common/validation/recipify";

const recipifyBsdasriAccessors = (
  bsd: ParsedZodBsdasri,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ParsedZodBsdasri>[] => [
  {
    role: CompanyRole.Transporter,
    skip: sealedFields.includes("transporterRecepisseNumber"),
    orgIdGetter: () => {
      const orgId = getTransporterCompanyOrgId({
        transporterCompanySiret: bsd.transporterCompanySiret ?? null,
        transporterCompanyVatNumber: bsd.transporterCompanyVatNumber ?? null
      });
      return orgId ?? null;
    },
    setter: async (bsdasri: ParsedZodBsdasri, receipt) => {
      if (bsdasri.transporterRecepisseIsExempted) {
        bsdasri.transporterRecepisseNumber = null;
        bsdasri.transporterRecepisseValidityLimit = null;
        bsdasri.transporterRecepisseDepartment = null;
      } else {
        bsdasri.transporterRecepisseNumber = receipt?.receiptNumber ?? null;
        bsdasri.transporterRecepisseValidityLimit =
          receipt?.validityLimit ?? null;
        bsdasri.transporterRecepisseDepartment = receipt?.department ?? null;
      }
    }
  },
  {
    role: CompanyRole.Broker,
    skip: sealedFields.includes("brokerRecepisseNumber"),
    orgIdGetter: () => {
      return bsd.brokerCompanySiret ?? null;
    },
    setter: async (bsdasri: ParsedZodBsdasri, receipt) => {
      if (!bsdasri.brokerRecepisseNumber && receipt?.receiptNumber) {
        bsdasri.brokerRecepisseNumber = receipt.receiptNumber;

        if (!bsdasri.brokerRecepisseValidityLimit && receipt?.validityLimit) {
          bsdasri.brokerRecepisseValidityLimit = receipt.validityLimit;
        }
        if (!bsdasri.brokerRecepisseDepartment && receipt?.department) {
          bsdasri.brokerRecepisseDepartment = receipt.department;
        }
      }
    }
  },
  {
    role: CompanyRole.Trader,
    skip: sealedFields.includes("traderRecepisseNumber"),
    orgIdGetter: () => {
      return bsd.traderCompanySiret ?? null;
    },
    setter: async (bsdasri: ParsedZodBsdasri, receipt) => {
      if (!bsdasri.traderRecepisseNumber && receipt?.receiptNumber) {
        bsdasri.traderRecepisseNumber = receipt.receiptNumber;
      }
      if (!bsdasri.traderRecepisseValidityLimit && receipt?.validityLimit) {
        bsdasri.traderRecepisseValidityLimit = receipt.validityLimit;
      }
      if (!bsdasri.traderRecepisseDepartment && receipt?.department) {
        bsdasri.traderRecepisseDepartment = receipt.department;
      }
    }
  }
];

export const recipifyBsdasri = buildRecipify<ParsedZodBsdasri>(
  recipifyBsdasriAccessors
);
