import { Bsda } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../../common/constants/companySearchHelpers";
import prisma from "../../prisma";

export const recipify = async (bsda: Bsda, enableSaveTransporterReceipt) => {
  if (bsda.transporterRecepisseIsExempted === true) {
    return bsda;
  }
  const orgId = getTransporterCompanyOrgId({
    transporterCompanySiret: bsda.transporterCompanySiret ?? null,
    transporterCompanyVatNumber: bsda.transporterCompanyVatNumber ?? null
  });

  let transporterReceipt;
  if (orgId) {
    transporterReceipt = await prisma.company
      .findUnique({
        where: {
          orgId
        }
      })
      .transporterReceipt();
  }

  const data = {
    transporterRecepisseNumber: transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseValidityLimit:
      transporterReceipt?.validityLimit ?? null,
    transporterRecepisseDepartment: transporterReceipt?.department ?? null
  };
  if (enableSaveTransporterReceipt) {
    await prisma.bsda.update({
      where: { id: bsda.id },
      data
    });
  }

  return {
    ...bsda,
    ...data
  };
};
