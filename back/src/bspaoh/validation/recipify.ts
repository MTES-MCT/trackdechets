import { getTransporterCompanyOrgId } from "@td/constants";
import { CompanyRole } from "../../common/validation/zod/schema";
import {
  buildRecipify,
  RecipifyInputAccessor
} from "../../common/validation/recipify";
import { ZodFullBspaoh } from "./schema";

const recipifyBspaohAccessors = (
  bsd: ZodFullBspaoh,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): RecipifyInputAccessor<ZodFullBspaoh>[] => [
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
    setter: async (bspaoh: ZodFullBspaoh, receipt) => {
      if (bspaoh.transporterRecepisseIsExempted) {
        bspaoh.transporterRecepisseNumber = null;
        bspaoh.transporterRecepisseValidityLimit = null;
        bspaoh.transporterRecepisseDepartment = null;
      } else {
        bspaoh.transporterRecepisseNumber = receipt?.receiptNumber ?? null;
        bspaoh.transporterRecepisseValidityLimit =
          receipt?.validityLimit ?? null;
        bspaoh.transporterRecepisseDepartment = receipt?.department ?? null;
      }
    }
  }
];

export const recipifyBspaoh = buildRecipify<ZodFullBspaoh>(
  recipifyBspaohAccessors
);
