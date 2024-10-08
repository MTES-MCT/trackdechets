import { getTransporterCompanyOrgId } from "@td/constants";
import { ParsedZodBsff } from "./schema";
import { BsffValidationContext, ZodBsffTransformer } from "./types";
import { CompanyRole } from "../../../common/validation/zod/schema";
import {
  buildRecipify,
  RecipifyInputAccessor
} from "../../../companies/recipify";

const recipifyBsffAccessors = (
  bsd: ParsedZodBsff
): RecipifyInputAccessor<ParsedZodBsff>[] => [
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
        setter: async (bsda: ParsedZodBsff, receipt) => {
          const transporter = bsda.transporters![idx];
          transporter.transporterRecepisseNumber =
            receipt?.receiptNumber ?? null;
          transporter.transporterRecepisseValidityLimit =
            receipt?.validityLimit ?? null;
          transporter.transporterRecepisseDepartment =
            receipt?.department ?? null;
        }
      } as RecipifyInputAccessor<ParsedZodBsff>)
  )
];

export const recipifyBsff: (
  context: BsffValidationContext
) => ZodBsffTransformer = () => {
  return async bsff => {
    // const sealedFields = await getSealedFields(bsda, context);
    const accessors = recipifyBsffAccessors(bsff);
    return buildRecipify(accessors, bsff);
  };
};
