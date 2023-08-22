import {
  BsdasriInput,
  BsdasriRecepisseInput
} from "../generated/graphql/types";
import { recipifyGeneric } from "../companies/recipify";
import {
  autocompletedRecepisse,
  genericGetter
} from "../common/validation/recipify";
import { Bsda, Bsdasri, Bsff, Bsvhu } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import prisma from "../prisma";

const dasriAccessors = (input: BsdasriInput) => [
  {
    getter: genericGetter(input),
    setter: (input: BsdasriInput, recepisseInput: BsdasriRecepisseInput) => ({
      ...input,
      transporter: {
        company: input.transporter?.company,
        transport: input.transporter?.transport,
        customInfo: input.transporter?.customInfo,
        recepisse: autocompletedRecepisse(input, recepisseInput)
      }
    })
  }
];

export const recipify = recipifyGeneric(dasriAccessors);

export interface BsdTransporterReceiptPart {
  transporterRecepisseNumber: string | null;
  transporterRecepisseDepartment: string | null;
  transporterRecepisseValidityLimit: Date | null;
}

export async function getTransporterReceipt(
  existingBsd: Bsdasri | Bsvhu | Bsda | Bsff
): Promise<BsdTransporterReceiptPart> {
  // fetch TransporterReceipt
  const orgId = getTransporterCompanyOrgId(existingBsd);
  let transporterReceipt;
  if (orgId) {
    transporterReceipt = await prisma.company.findUnique({
      where: { orgId },
      select: {
        transporterReceiptDepartment: true,
        transporterReceiptNumber: true,
        transporterReceiptValidityLimit: true
      }
    });
  }
  return {
    transporterRecepisseNumber:
      transporterReceipt?.transporterReceiptNumber ?? null,
    transporterRecepisseDepartment:
      transporterReceipt?.transporterReceiptDepartment ?? null,
    transporterRecepisseValidityLimit:
      transporterReceipt?.transporterReceiptValidityLimit ?? null
  };
}
