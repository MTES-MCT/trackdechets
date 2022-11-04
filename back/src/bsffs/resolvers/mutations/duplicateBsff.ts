import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { indexBsff } from "../../elastic";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { getBsffOrNotFound } from "../../database";
import { GraphQLContext } from "../../../types";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BsffStatus } from "@prisma/client";

const duplicateBsff: MutationResolvers["duplicateBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  await isBsffContributor(user, existingBsff);

  const duplicatedBsff = await prisma.bsff.create({
    data: {
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
      transporterRecepisseDepartment:
        existingBsff.transporterRecepisseDepartment,
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
    }
  });

  await indexBsff(duplicatedBsff, { user } as GraphQLContext);

  return expandBsffFromDB(duplicatedBsff);
};

export default duplicateBsff;
