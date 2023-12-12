import prisma from "../../../prisma";
import { Company, Prisma } from "@prisma/client";
import {
  MutationUpdateCompanyArgs,
  CompanyPrivate
} from "../../../generated/graphql/types";
import * as yup from "yup";
import {
  convertUrls,
  updateFavorites,
  getUpdatedCompanyNameAndAddress
} from "../../database";
import { logger } from "@td/logger";
import { SiretNotFoundError } from "../../sirene/errors";

export async function updateCompanyFn(
  args: MutationUpdateCompanyArgs,
  existingCompany: Pick<Company, "name" | "address" | "orgId">
): Promise<CompanyPrivate> {
  const {
    id,
    companyTypes,
    gerepId,
    contact,
    contactEmail,
    contactPhone,
    website,
    givenName,
    transporterReceiptId,
    traderReceiptId,
    brokerReceiptId,
    vhuAgrementDemolisseurId,
    vhuAgrementBroyeurId,
    workerCertificationId,
    ecoOrganismeAgreements,
    allowBsdasriTakeOverWithoutSignature
  } = args;
  const data: Prisma.CompanyUpdateInput = {
    ...(companyTypes != null ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId != null ? { gerepId } : {}),
    ...(contact != null ? { contact } : {}),
    ...(contactEmail != null ? { contactEmail } : {}),
    ...(contactPhone != null ? { contactPhone } : {}),
    ...(website != null ? { website } : {}),
    ...(givenName != null ? { givenName } : {}),
    ...(allowBsdasriTakeOverWithoutSignature !== null
      ? { allowBsdasriTakeOverWithoutSignature }
      : {}),
    ...(transporterReceiptId
      ? { transporterReceipt: { connect: { id: transporterReceiptId } } }
      : {}),
    ...(traderReceiptId
      ? { traderReceipt: { connect: { id: traderReceiptId } } }
      : {}),
    ...(brokerReceiptId
      ? { brokerReceipt: { connect: { id: brokerReceiptId } } }
      : {}),
    ...(vhuAgrementDemolisseurId
      ? {
          vhuAgrementDemolisseur: { connect: { id: vhuAgrementDemolisseurId } }
        }
      : {}),
    ...(vhuAgrementBroyeurId
      ? { vhuAgrementBroyeur: { connect: { id: vhuAgrementBroyeurId } } }
      : {}),
    ...(workerCertificationId
      ? { workerCertification: { connect: { id: workerCertificationId } } }
      : {}),
    ...(ecoOrganismeAgreements != null
      ? {
          ecoOrganismeAgreements: {
            set: ecoOrganismeAgreements.map(a => a.toString())
          }
        }
      : {})
  };
  const companySchema = yup.object().shape({
    website: yup.string().url("L'url est invalide")
  });
  // A string like javascript:alert("p0wned") might be reflected on company public page
  // this is not filtered by the xss middleware
  await companySchema.validate(data);

  // Trigger update name and address
  let correctedNameAndAddress: Pick<Company, "name" | "address"> | null;
  try {
    correctedNameAndAddress = await getUpdatedCompanyNameAndAddress(
      existingCompany
    );
    if (correctedNameAndAddress) {
      data.name = correctedNameAndAddress.name;
      data.address = correctedNameAndAddress.address;
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

  const company = await prisma.company.update({
    where: { id },
    data
  });
  await updateFavorites([company.orgId]);
  return convertUrls(company);
}
