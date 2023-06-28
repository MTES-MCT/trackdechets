import { getTransporterCompanyOrgId } from "../../common/constants/companySearchHelpers";
import prisma from "../../prisma";
import { ZodBsda } from "./schema";

/**
 *
 * @param val Runs a bunch (currently one) function to enrich bsda input with computed values
 * @returns
 */
export const runTransformers = async (val: ZodBsda): Promise<ZodBsda> => {
  const transformers = [reshipmentBsdaTransformer, recipify];
  for (const transformer of transformers) {
    val = await transformer(val);
  }
  return val;
};

const reshipmentBsdaTransformer = async (val: ZodBsda): Promise<ZodBsda> => {
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
};

export const recipify = async (bsda: ZodBsda) => {
  if (bsda.transporterRecepisseIsExempted === true) {
    return bsda;
  }
  const transporterReceipt = await prisma.company
    .findUnique({
      where: {
        orgId: getTransporterCompanyOrgId({
          transporterCompanySiret: bsda.transporterCompanySiret ?? null,
          transporterCompanyVatNumber: bsda.transporterCompanyVatNumber ?? null
        })!
      }
    })
    .transporterReceipt();

  const {
    transporterRecepisseNumber,
    transporterRecepisseValidityLimit,
    transporterRecepisseDepartment
  } = await prisma.bsda.update({
    where: { id: bsda.id },
    select: {
      transporterRecepisseNumber: true,
      transporterRecepisseValidityLimit: true,
      transporterRecepisseDepartment: true
    },
    data: {
      transporterRecepisseNumber: transporterReceipt?.receiptNumber ?? null,
      transporterRecepisseValidityLimit:
        transporterReceipt?.validityLimit ?? null,
      transporterRecepisseDepartment: transporterReceipt?.department ?? null
    }
  });

  return {
    ...bsda,
    transporterRecepisseNumber,
    transporterRecepisseValidityLimit,
    transporterRecepisseDepartment
  };
};
