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
  siret,
  companyTypes,
  gerepId,
  contactEmail,
  contactPhone,
  website,
  givenName,
  transporterReceiptId,
  traderReceiptId,
  brokerReceiptId,
  vhuAgrementDemolisseurId,
  vhuAgrementBroyeurId,
  ecoOrganismeAgreements
}: MutationUpdateCompanyArgs): Promise<CompanyPrivate> {
  const data = {
    ...(companyTypes != null ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId != null ? { gerepId } : {}),
    ...(contactEmail != null ? { contactEmail } : {}),
    ...(contactPhone != null ? { contactPhone } : {}),
    ...(website != null ? { website } : {}),
    ...(givenName != null ? { givenName } : {}),
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
    ...(ecoOrganismeAgreements != null
      ? {
          ecoOrganismeAgreements: {
            set: ecoOrganismeAgreements.map(a => a.toString())
          }
        }
      : {})
  };

  const company = await prisma.company.update({
    where: { siret },
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
  const company = await getCompanyOrCompanyNotFound({ siret: args.siret });
  await checkIsCompanyAdmin(user, company);

  const companyTypes = args.companyTypes || company.companyTypes;
  const { ecoOrganismeAgreements } = args;
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
