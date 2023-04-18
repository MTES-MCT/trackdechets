import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { checkCanDuplicate } from "../../permissions";
import { getBsffOrNotFound } from "../../database";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BsffStatus, Prisma } from "@prisma/client";
import { getBsffRepository } from "../../repository";

const duplicateBsff: MutationResolvers["duplicateBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  await checkCanDuplicate(user, existingBsff);

  const createInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    isDraft: true,
    type: existingBsff.type,
    status: BsffStatus.INITIAL,
    emitterCompanyName: existingBsff.emitterCompanyName,
    emitterCompanySiret: existingBsff.emitterCompanySiret,
    emitterCompanyAddress: existingBsff.emitterCompanyAddress,
    emitterCompanyContact: existingBsff.emitterCompanyContact,
    emitterCompanyPhone: existingBsff.emitterCompanyPhone,
    emitterCompanyMail: existingBsff.emitterCompanyMail,
    wasteCode: existingBsff.wasteCode,
    wasteDescription: existingBsff.wasteDescription,
    wasteAdr: existingBsff.wasteAdr,
    weightValue: existingBsff.weightValue,
    weightIsEstimate: existingBsff.weightIsEstimate,
    transporterCompanyName: existingBsff.transporterCompanyName,
    transporterCompanySiret: existingBsff.transporterCompanySiret,
    transporterCompanyVatNumber: existingBsff.transporterCompanyVatNumber,
    transporterCompanyAddress: existingBsff.transporterCompanyAddress,
    transporterCompanyContact: existingBsff.transporterCompanyContact,
    transporterCompanyPhone: existingBsff.transporterCompanyPhone,
    transporterCompanyMail: existingBsff.transporterCompanyMail,
    transporterRecepisseNumber: existingBsff.transporterRecepisseNumber,
    transporterRecepisseDepartment: existingBsff.transporterRecepisseDepartment,
    transporterRecepisseValidityLimit:
      existingBsff.transporterRecepisseValidityLimit,
    transporterTransportMode: existingBsff.transporterTransportMode,
    transporterTransportPlates: existingBsff.transporterTransportPlates,
    destinationCap: existingBsff.destinationCap,
    destinationCompanyName: existingBsff.destinationCompanyName,
    destinationCompanySiret: existingBsff.destinationCompanySiret,
    destinationCompanyAddress: existingBsff.destinationCompanyAddress,
    destinationCompanyContact: existingBsff.destinationCompanyContact,
    destinationCompanyPhone: existingBsff.destinationCompanyPhone,
    destinationCompanyMail: existingBsff.destinationCompanyMail,
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

export default duplicateBsff;
