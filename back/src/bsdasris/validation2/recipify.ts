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
  }
];

export const recipifyBsdasri = buildRecipify<ParsedZodBsdasri>(
  recipifyBsdasriAccessors
);
