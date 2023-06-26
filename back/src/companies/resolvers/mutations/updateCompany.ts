import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { updateCompanyFn } from "./updateCompanyService";
import { isForeignVat } from "../../../common/constants/companySearchHelpers";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";

const updateCompanyResolver: MutationResolvers["updateCompany"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ id: args.id });

  await checkUserPermissions(
    user,
    company.orgId,
    Permission.CompanyCanUpdate,
    NotCompanyAdminErrorMsg(company.orgId)
  );

  const companyTypes = args.companyTypes || company.companyTypes;
  const { ecoOrganismeAgreements } = args;
  // update to anything else than ony a TRANSPORTER
  const updateOtherThanTransporter = args.companyTypes?.some(
    elt => elt !== "TRANSPORTER"
  );
  // check that a TRANSPORTER identified by VAT is not updated to any other type
  if (isForeignVat(company.vatNumber) && updateOtherThanTransporter) {
    throw new UserInputError(
      "Impossible de changer de type TRANSPORTER pour un établissement transporteur étranger"
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
  } else if (
    Array.isArray(ecoOrganismeAgreements) &&
    ecoOrganismeAgreements.length > 0
  ) {
    throw new UserInputError(
      "Impossible de mettre à jour les agréments éco-organisme de cette entreprise : il ne s'agit pas d'un éco-organisme."
    );
  }

  return updateCompanyFn(args);
};

export default updateCompanyResolver;
