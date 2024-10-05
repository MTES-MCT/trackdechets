import { getTransporterCompanyOrgId } from "@td/constants";
import { getSealedFields } from "./rules";
import { ParsedZodBsda } from "./schema";
import { BsdaValidationContext, ZodBsdaTransformer } from "./types";
import { CompanyRole } from "../../common/validation/zod/schema";
import { buildRecipify, RecipifyInputAccessor } from "../../companies/recipify";

const recipifyBsdaAccessors = (
  bsd: ParsedZodBsda,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ParsedZodBsda>[] => [
  ...(bsd.transporters ?? []).map(
    (_, idx) =>
      ({
        role: CompanyRole.Transporter,
        skip:
          bsd.transporters![idx].transporterRecepisseIsExempted ||
          bsd.transporters![idx].transporterTransportSignatureDate,
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
          transporter.transporterRecepisseNumber =
            receipt?.receiptNumber ?? null;
          transporter.transporterRecepisseValidityLimit =
            receipt?.validityLimit ?? null;
          transporter.transporterRecepisseDepartment =
            receipt?.department ?? null;
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
      bsda.brokerRecepisseNumber = receipt?.receiptNumber ?? null;
      bsda.brokerRecepisseValidityLimit = receipt?.validityLimit ?? null;
      bsda.brokerRecepisseDepartment = receipt?.department ?? null;
    }
  }
];

export const recipifyBsda: (
  context: BsdaValidationContext
) => ZodBsdaTransformer = context => {
  return async bsda => {
    const sealedFields = await getSealedFields(bsda, context);
    const accessors = recipifyBsdaAccessors(bsda, sealedFields);
    return buildRecipify(accessors, bsda);
  };
};
