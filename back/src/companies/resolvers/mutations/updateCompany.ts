import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import {
  MutationUpdateCompanyArgs,
  CompanyPrivate,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { convertUrls, getCompanyOrCompanyNotFound } from "../../database";
import { checkIsCompanyAdmin } from "../../../users/permissions";

export async function updateCompanyFn({
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
}: MutationUpdateCompanyArgs): Promise<CompanyPrivate> {
  const data = {
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

  const company = await prisma.company.update({
    where: { id },
    data
  });

  return convertUrls(company);
}

const updateCompanyResolver: MutationResolvers["updateCompany"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ id: args.id });
  await checkIsCompanyAdmin(user, company);

  const companyTypes = args.companyTypes || company.companyTypes;
  const { ecoOrganismeAgreements } = args;
  // update to anything else than ony a TRANSPORTER
  const updateOtherThanTransporter = args.companyTypes?.some(
    elt => elt !== "TRANSPORTER"
  );
  // check that a TRANSPORTER identified by VAT is not updated to any other type
  if (company.vatNumber === company.siret && updateOtherThanTransporter) {
    throw new UserInputError(
      "Impossible de changer de type TRANSPORTER pour un établissement transporteur identifié par son numéro de TVA"
    );
  }
  if (companyTypes.includes("ECO_ORGANISME")) {
    if (
      Array.isArray(ecoOrganismeAgreements) &&
      ecoOrganismeAgreements.length < 1
    ) {
      throw new UserInputError(
        "Impossible de mettre à jour les agréments éco-organisme de cette entreprise : elle doit en posséder au moins 1."
      );
    }
  } else if (ecoOrganismeAgreements?.length > 0) {
    throw new UserInputError(
      "Impossible de mettre à jour les agréments éco-organisme de cette entreprise : il ne s'agit pas d'un éco-organisme."
    );
  }

  return updateCompanyFn(args);
};

export default updateCompanyResolver;
