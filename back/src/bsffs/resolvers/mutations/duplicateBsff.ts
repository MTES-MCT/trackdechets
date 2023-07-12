import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { checkCanDuplicate } from "../../permissions";
import { getBsffOrNotFound } from "../../database";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { Bsff, BsffStatus, Prisma } from "@prisma/client";
import { getBsffRepository } from "../../repository";
import prisma from "../../../prisma";

const duplicateBsff: MutationResolvers["duplicateBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  await checkCanDuplicate(user, existingBsff);

  const { emitter, transporter, destination } = await getBsffCompanies(
    existingBsff
  );

  const createInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    isDraft: true,
    type: existingBsff.type,
    status: BsffStatus.INITIAL,
    emitterCompanyName: emitter?.name ?? existingBsff.emitterCompanyName,
    emitterCompanySiret: emitter?.siret ?? existingBsff.emitterCompanySiret,
    emitterCompanyAddress:
      emitter?.address ?? existingBsff.emitterCompanyAddress,
    emitterCompanyContact:
      emitter?.contact ?? existingBsff.emitterCompanyContact,
    emitterCompanyPhone:
      emitter?.contactPhone ?? existingBsff.emitterCompanyPhone,
    emitterCompanyMail:
      emitter?.contactEmail ?? existingBsff.emitterCompanyMail,
    wasteCode: existingBsff.wasteCode,
    wasteDescription: existingBsff.wasteDescription,
    wasteAdr: existingBsff.wasteAdr,
    weightValue: existingBsff.weightValue,
    weightIsEstimate: existingBsff.weightIsEstimate,
    transporterCompanyName:
      transporter?.name ?? existingBsff.transporterCompanyName,
    transporterCompanySiret: existingBsff.transporterCompanySiret,
    transporterCompanyVatNumber: existingBsff.transporterCompanyVatNumber,
    transporterCompanyAddress:
      transporter?.address ?? existingBsff.transporterCompanyAddress,
    transporterCompanyContact:
      transporter?.contact ?? existingBsff.transporterCompanyContact,
    transporterCompanyPhone:
      transporter?.contactPhone ?? existingBsff.transporterCompanyPhone,
    transporterCompanyMail:
      transporter?.contactEmail ?? existingBsff.transporterCompanyMail,
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null,
    transporterTransportMode: existingBsff.transporterTransportMode,
    transporterTransportPlates: existingBsff.transporterTransportPlates,
    destinationCap: existingBsff.destinationCap,
    destinationCompanyName:
      destination?.name ?? existingBsff.destinationCompanyName,
    destinationCompanySiret: existingBsff.destinationCompanySiret,
    destinationCompanyAddress:
      destination?.address ?? existingBsff.destinationCompanyAddress,
    destinationCompanyContact:
      destination?.contact ?? existingBsff.destinationCompanyContact,
    destinationCompanyPhone:
      destination?.contactPhone ?? existingBsff.destinationCompanyPhone,
    destinationCompanyMail:
      destination?.contactEmail ?? existingBsff.destinationCompanyMail,
    destinationPlannedOperationCode:
      existingBsff.destinationPlannedOperationCode
  };

  const { create: createBsff } = getBsffRepository(user);

  const duplicatedBsff = await createBsff(
    { data: createInput },
    {
      duplicate: { id: existingBsff.id }
    }
  );

  return expandBsffFromDB(duplicatedBsff);
};

async function getBsffCompanies(bsff: Bsff) {
  const companiesOrgIds = [
    bsff.emitterCompanySiret,
    bsff.transporterCompanySiret,
    bsff.transporterCompanyVatNumber,
    bsff.destinationCompanySiret
  ].filter(Boolean);

  // Batch fetch all companies involved in the BSFF
  const companies = await prisma.company.findMany({
    where: { orgId: { in: companiesOrgIds } },
    include: {
      transporterReceipt: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === bsff.emitterCompanySiret
  );

  const destination = companies.find(
    company => company.orgId === bsff.destinationCompanySiret
  );

  const transporter = companies.find(
    company =>
      company.orgId === bsff.transporterCompanySiret ||
      company.orgId === bsff.transporterCompanyVatNumber
  );

  return { emitter, destination, transporter };
}

export default duplicateBsff;
