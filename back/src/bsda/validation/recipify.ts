import { getTransporterCompanyOrgId } from "@td/constants";
import { ParsedZodBsda } from "./schema";
import { CompanyRole } from "../../common/validation/zod/schema";
import {
  buildRecipify,
  RecipifyInputAccessor
} from "../../common/validation/recipify";

const recipifyBsdaAccessors = (
  bsd: ParsedZodBsda,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ParsedZodBsda>[] => [
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
        setter: async (bsda: ParsedZodBsda, receipt) => {
          const transporter = bsda.transporters![idx];
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
      } as RecipifyInputAccessor<ParsedZodBsda>)
  ),
  {
    role: CompanyRole.Broker,
    skip: sealedFields.includes("brokerRecepisseNumber"),
    orgIdGetter: () => {
      return bsd.brokerCompanySiret ?? null;
    },
    setter: async (bsda: ParsedZodBsda, receipt) => {
      if (!bsda.brokerRecepisseNumber && receipt?.receiptNumber) {
        bsda.brokerRecepisseNumber = receipt.receiptNumber;
      }
      if (!bsda.brokerRecepisseValidityLimit && receipt?.validityLimit) {
        bsda.brokerRecepisseValidityLimit = receipt.validityLimit;
      }
      if (!bsda.brokerRecepisseDepartment && receipt?.department) {
        bsda.brokerRecepisseDepartment = receipt.department;
      }
    }
  }
];

export const recipifyBsda = buildRecipify<ParsedZodBsda>(recipifyBsdaAccessors);
