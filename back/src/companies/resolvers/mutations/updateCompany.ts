import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyOrCompanyNotFound,
  getUpdatedCompanyNameAndAddress,
  updateFavorites
} from "../../database";

import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { Prisma } from "@prisma/client";
import { ZodCompany } from "../../validation/schema";
import { safeInput } from "../../../common/converter";
import { parseCompanyAsync } from "../../validation/index";
import { SiretNotFoundError } from "../../sirene/errors";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../converters";

const updateCompanyResolver: MutationResolvers["updateCompany"] = async (
  parent,
  args,
  context
) => {
  const authStrategies = [AuthType.Session];
  if (args.transporterReceiptId && Object.keys(args).length === 1) {
    // Autorise une modification de l'établissement par API si elle
    // porte sur le récépissé transporteur uniquement
    authStrategies.push(AuthType.Bearer);
  }
  applyAuthStrategies(context, authStrategies);
  const user = checkIsAuthenticated(context);
  const existingCompany = await getCompanyOrCompanyNotFound({ id: args.id });
  await checkUserPermissions(
    user,
    existingCompany.orgId,
    Permission.CompanyCanUpdate,
    NotCompanyAdminErrorMsg(existingCompany.orgId)
  );

  const zodCompany: ZodCompany = {
    ...existingCompany,
    ...safeInput(args),
    companyTypes: args.companyTypes ?? existingCompany.companyTypes,
    ecoOrganismeAgreements: args.ecoOrganismeAgreements
      ? args.ecoOrganismeAgreements.map(a => a.href)
      : existingCompany.ecoOrganismeAgreements
  };

  const {
    companyTypes,
    collectorTypes,
    wasteProcessorTypes,
    wasteVehiclesTypes,
    gerepId,
    contact,
    contactEmail,
    contactPhone,
    website,
    givenName,
    allowBsdasriTakeOverWithoutSignature,
    allowAppendix1SignatureAutomation,
    transporterReceiptId,
    traderReceiptId,
    brokerReceiptId,
    workerCertificationId,
    vhuAgrementBroyeurId,
    vhuAgrementDemolisseurId,
    ecoOrganismeAgreements
  } = await parseCompanyAsync(zodCompany);

  const data: Prisma.CompanyUpdateInput = {
    companyTypes,
    collectorTypes,
    wasteProcessorTypes,
    wasteVehiclesTypes,
    gerepId,
    contact,
    contactEmail,
    contactPhone,
    website,
    givenName,
    allowBsdasriTakeOverWithoutSignature,
    allowAppendix1SignatureAutomation,
    ecoOrganismeAgreements
  };

  if (transporterReceiptId !== undefined) {
    data.transporterReceipt = transporterReceiptId
      ? { connect: { id: transporterReceiptId } }
      : { disconnect: true };
  }

  if (traderReceiptId !== undefined) {
    data.traderReceipt = traderReceiptId
      ? { connect: { id: traderReceiptId } }
      : { disconnect: true };
  }

  if (brokerReceiptId !== undefined) {
    data.brokerReceipt = brokerReceiptId
      ? { connect: { id: brokerReceiptId } }
      : { disconnect: true };
  }

  if (workerCertificationId !== undefined) {
    data.workerCertification = workerCertificationId
      ? { connect: { id: workerCertificationId } }
      : { disconnect: true };
  }
  if (vhuAgrementBroyeurId !== undefined) {
    data.vhuAgrementBroyeur = vhuAgrementBroyeurId
      ? { connect: { id: vhuAgrementBroyeurId } }
      : { disconnect: true };
  }

  if (vhuAgrementDemolisseurId !== undefined) {
    data.vhuAgrementDemolisseur = vhuAgrementDemolisseurId
      ? { connect: { id: vhuAgrementDemolisseurId } }
      : { disconnect: true };
  }

  // Trigger update name and address
  try {
    const updateFromExternalService = await getUpdatedCompanyNameAndAddress(
      existingCompany
    );
    if (updateFromExternalService) {
      data.name = updateFromExternalService.name;
      data.address = updateFromExternalService.address;

      if (updateFromExternalService.codeNaf) {
        data.codeNaf = updateFromExternalService.codeNaf;
      }
    }
  } catch (err) {
    // update was only for name and address
    if (Object.keys(args).length === 1 && !!args.id) {
      if (err.name === "GraphQLError") {
        throw new SiretNotFoundError();
      }
      throw new Error(`Erreur durant la requête, veuillez réessayer plus tard`);
    }
    logger.error(
      `Error updating Company ${existingCompany.orgId} from INSEE: `,
      err
    );
  }

  const updatedCompany = await prisma.company.update({
    where: { id: existingCompany.id },
    data
  });

  await updateFavorites([existingCompany.orgId]);

  return toGqlCompanyPrivate(updatedCompany);
};

export default updateCompanyResolver;
