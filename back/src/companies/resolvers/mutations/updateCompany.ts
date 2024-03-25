import {
  MutationResolvers,
  MutationUpdateCompanyArgs,
  RequireFields
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { convertUrls, getCompanyOrCompanyNotFound } from "../../database";
import { updateCompanyFn } from "./updateCompanyService";
import { isForeignVat } from "@td/constants";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";
import {
  CollectorType,
  Company,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
import { companyTypesValidationSchema } from "../../validation";

const validateCompanyTypes = (
  company: Company,
  args: RequireFields<MutationUpdateCompanyArgs, "id">
) => {
  let { companyTypes, collectorTypes, wasteProcessorTypes } = {
    ...company,
    ...args
  };

  // Nullify sub-types automatically
  if (args?.companyTypes?.length) {
    if (
      company.companyTypes?.includes(CompanyType.COLLECTOR) &&
      !args?.companyTypes?.includes(CompanyType.COLLECTOR)
    ) {
      collectorTypes = [];
    }
    if (
      company.companyTypes?.includes(CompanyType.WASTEPROCESSOR) &&
      !args?.companyTypes?.includes(CompanyType.WASTEPROCESSOR)
    ) {
      wasteProcessorTypes = [];
    }
  }

  return companyTypesValidationSchema.validate({
    companyTypes,
    collectorTypes,
    wasteProcessorTypes
  });
};

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
  const company = await getCompanyOrCompanyNotFound({ id: args.id });
  await checkUserPermissions(
    user,
    company.orgId,
    Permission.CompanyCanUpdate,
    NotCompanyAdminErrorMsg(company.orgId)
  );

  // Validate & transform company types & sub-types
  const { companyTypes, collectorTypes, wasteProcessorTypes } =
    await validateCompanyTypes(company, args);

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

  const updatedCompany = await updateCompanyFn(
    {
      ...args,
      companyTypes: companyTypes as CompanyType[],
      collectorTypes: collectorTypes as CollectorType[],
      wasteProcessorTypes: wasteProcessorTypes as WasteProcessorType[]
    },
    company
  );

  // conversion to CompanyPrivate type
  const naf = (updatedCompany as Company).codeNaf ?? company.codeNaf;
  const libelleNaf = libelleFromCodeNaf(naf!);
  return {
    ...convertUrls(updatedCompany),
    naf,
    libelleNaf
  };
};

export default updateCompanyResolver;
