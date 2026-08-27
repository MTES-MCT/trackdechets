import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { checkCanDuplicate } from "../../permissions";
import { getBsffOrNotFound, getFirstTransporterSync } from "../../database";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BsffStatus, Prisma } from "@td/prisma";
import { getBsffRepository } from "../../repository";
import { prisma } from "@td/prisma";
import {
  sirenifyBsffCreateInput,
  sirenifyBsffTransporterCreateInput
} from "../../sirenify";
import { BsffWithTransporters, BsffWithTransportersInclude } from "../../types";

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

  const bsffTransporter = getFirstTransporterSync(existingBsff);

  let createInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    isDraft: true,
    type: existingBsff.type,
    status: BsffStatus.INITIAL,
    isDuplicateOf: existingBsff.id,
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
      existingBsff.destinationPlannedOperationCode,
    transporters: {
      create: { number: 1 }
    }
  };

  if (bsffTransporter) {
    const {
      // transport values that should not be duplicated
      id: transporterId,
      bsffId: transporterBffId,
      transporterTransportPlates,
      transporterTransportTakenOverAt,
      transporterTransportSignatureAuthor,
      transporterTransportSignatureDate,
      transporterCustomInfo,
      number,
      // transporter values that should be duplicated
      ...transporterData
    } = bsffTransporter;

    const bsffTransporterCreateInput: Prisma.BsffTransporterCreateInput = {
      ...transporterData,
      number: 1,
      // Transporter company info
      transporterCompanyName:
        transporter?.name ?? bsffTransporter.transporterCompanyName,
      transporterCompanyAddress:
        transporter?.address ?? bsffTransporter.transporterCompanyAddress,
      transporterCompanyMail:
        transporter?.contactEmail ?? bsffTransporter.transporterCompanyMail,
      transporterCompanyPhone:
        transporter?.contactPhone ?? bsffTransporter.transporterCompanyPhone,
      transporterCompanyContact:
        transporter?.contact ?? bsffTransporter.transporterCompanyContact,
      // Transporter recepisse
      transporterRecepisseNumber:
        transporter?.transporterReceipt?.receiptNumber ?? null,
      transporterRecepisseValidityLimit:
        transporter?.transporterReceipt?.validityLimit ?? null,
      transporterRecepisseDepartment:
        transporter?.transporterReceipt?.department ?? null
    };

    createInput = {
      ...createInput,
      transporters: {
        create: await sirenifyBsffTransporterCreateInput(
          bsffTransporterCreateInput,
          []
        )
      }
    };
  }

  const { create: createBsff } = getBsffRepository(user);

  const sirenified = await sirenifyBsffCreateInput(createInput, []);

  const duplicatedBsff = await createBsff(
    { data: sirenified, include: BsffWithTransportersInclude },
    {
      duplicate: { id: existingBsff.id }
    }
  );

  return expandBsffFromDB(duplicatedBsff);
};

async function getBsffCompanies(bsff: BsffWithTransporters) {
  const bsffTransporter = getFirstTransporterSync(bsff);

  const companiesOrgIds = [
    bsff.emitterCompanySiret,
    bsffTransporter?.transporterCompanySiret,
    bsffTransporter?.transporterCompanyVatNumber,
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
      company.orgId === bsffTransporter?.transporterCompanySiret ||
      company.orgId === bsffTransporter?.transporterCompanyVatNumber
  );

  return { emitter, destination, transporter };
}

export default duplicateBsff;
