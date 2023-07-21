import { getTransporterCompanyOrgId } from "../../common/constants/companySearchHelpers";
import prisma from "../../prisma";
import { ZodBsda } from "./schema";
import { sirenify } from "./sirenify";

/**
 *
 * @param val Runs a bunch function to enrich bsda input with computed values
 * @returns
 */
export const runTransformers = async (
  val: ZodBsda,
  sealedFields: string[] // Tranformations should not be run on sealed fields
): Promise<ZodBsda> => {
  const transformers = [
    reshipmentBsdaTransformer,
    sirenify,
    recipisseTransporterTransformer
  ];
  for (const transformer of transformers) {
    val = await transformer(val, sealedFields);
  }
  return val;
};

async function reshipmentBsdaTransformer(
  val: ZodBsda,
  _: string[]
): Promise<ZodBsda> {
  if (
    val.type === "RESHIPMENT" &&
    !val?.wasteConsistence &&
    !!val?.forwarding
  ) {
    const forwarding = await prisma.bsda.findUnique({
      where: { id: val.forwarding }
    });
    if (!!forwarding) {
      val = { ...val, wasteConsistence: forwarding.wasteConsistence };
    }
  }
  return val;
}

async function recipisseTransporterTransformer(
  val: ZodBsda,
  sealedFields: string[]
): Promise<ZodBsda> {
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
