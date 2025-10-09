import { getTransporterCompanyOrgId } from "@td/constants";
import { ParsedZodBsvhu } from "./schema";
import { CompanyRole } from "../../common/validation/zod/schema";
import {
  buildRecipify,
  RecipifyInputAccessor
} from "../../common/validation/recipify";

const recipifyBsvhuAccessors = (
  bsd: ParsedZodBsvhu,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ParsedZodBsvhu>[] => [
  ...(bsd.transporters ?? []).map(
    (_, idx) =>
      ({
        role: CompanyRole.Transporter,
        skip: !!bsd.transporters![idx].transporterTransportSignatureDate,
        orgIdGetter: () => {
          const orgId = getTransporterCompanyOrgId({
            transporterCompanySiret:
              bsd.transporters![idx].transporterCompanySiret ?? null,
            transporterCompanyVatNumber:
              bsd.transporters![idx].transporterCompanyVatNumber ?? null
          });
          return orgId ?? null;
        },
        setter: async (bsvhu: ParsedZodBsvhu, receipt) => {
          const transporter = bsvhu.transporters![idx];
          if (transporter.transporterRecepisseIsExempted) {
            transporter.transporterRecepisseNumber = null;
            transporter.transporterRecepisseValidityLimit = null;
            transporter.transporterRecepisseDepartment = null;
          } else {
            transporter.transporterRecepisseNumber =
              receipt?.receiptNumber ?? null;
            transporter.transporterRecepisseValidityLimit =
              receipt?.validityLimit ?? null;
            transporter.transporterRecepisseDepartment =
              receipt?.department ?? null;
          }
        }
      } as RecipifyInputAccessor<ParsedZodBsvhu>)
  ),
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

export const recipifyBsvhu = buildRecipify<ParsedZodBsvhu>(
  recipifyBsvhuAccessors
);
