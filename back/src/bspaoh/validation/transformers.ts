import { prisma } from "@td/prisma";
import { ZodBspaohTransporter, ZodFullBspaoh } from "./schema";
import { sirenify } from "./sirenify";
import { getTransporterCompanyOrgId } from "@td/constants";

/**
 *
 * @param val Runs a bunch function to enrich bspaoh input with computed values
 * @returns
 */
export const runTransformers = async (
  val: ZodFullBspaoh,
  sealedFields: string[] // Transformations should not be run on sealed fields
): Promise<ZodFullBspaoh> => {
  const transformers = [sirenify, recipisseTransporterTransformer];
  for (const transformer of transformers) {
    val = await transformer(val, sealedFields);
  }
  return val;
};

async function recipisseTransporterTransformer(
  val: ZodBspaohTransporter,
  sealedFields: string[]
): Promise<ZodBspaohTransporter> {
  if (sealedFields.includes("transporterCompanySiret")) {
    return val;
  }

  const orgId = getTransporterCompanyOrgId({
    transporterCompanySiret: val.transporterCompanySiret ?? null,
    transporterCompanyVatNumber: val.transporterCompanyVatNumber ?? null
  });

  if (!val.transporterRecepisseIsExempted && orgId) {
    const transporterReceipt = await prisma.company
      .findUnique({
        where: {
          orgId
        }
      })
      .transporterReceipt();

    val.transporterRecepisseNumber = transporterReceipt?.receiptNumber ?? null;
    val.transporterRecepisseValidityLimit =
      transporterReceipt?.validityLimit ?? null;
    val.transporterRecepisseDepartment = transporterReceipt?.department ?? null;
  }

  return val;
}
