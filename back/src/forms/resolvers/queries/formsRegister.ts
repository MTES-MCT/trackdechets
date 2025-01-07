import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  FormsRegisterExportType,
  QueryResolvers,
  QueryWastesRegistryCsvArgs,
  QueryWastesRegistryXlsArgs,
  WasteRegistryType
} from "@td/codegen-back";
import { wastesRegistryCsvResolverFn } from "../../../registry/resolvers/queries/wastesRegistryCsv";
import { wastesRegistryXlsResolverFn } from "../../../registry/resolvers/queries/wastesRegistryXls";
import { can, getUserRoles, Permission } from "../../../permissions";
import { ForbiddenError } from "../../../common/errors";

// compatibility between register v1 and register v2
const exportTypeToRegisterType: Record<
  FormsRegisterExportType,
  WasteRegistryType
> = {
  OUTGOING: "OUTGOING",
  INCOMING: "INCOMING",
  TRANSPORTED: "TRANSPORTED",
  TRADED: "MANAGED",
  BROKERED: "MANAGED",
  ALL: "ALL"
};

/**
 * DEPRECATED
 * Forms only register exports
 * This resolver calls wastesXls or wastesCsv resolver with bsdType=BSDD
 * for compatibility
 */
const formsRegisterResolver: QueryResolvers["formsRegister"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const userRoles = await getUserRoles(user.id);

  for (const siret of args.sirets) {
    // check user can read registry of evry provided siret
    const role = userRoles[siret];
    if (!role || !can(role, Permission.RegistryCanRead)) {
      throw new ForbiddenError(
        `Vous n'avez pas la permission d'accéder au registre de l'établissement ${siret}`
      );
    }
  }

  const wasteRegistryArgs:
    | QueryWastesRegistryCsvArgs
    | QueryWastesRegistryXlsArgs = {
    registryType: exportTypeToRegisterType[args.exportType ?? "ALL"],
    sirets: args.sirets,
    where: {
      bsdType: { _eq: "BSDD" },
      ...(args.wasteCode ? { wasteCode: { _eq: args.wasteCode } } : {}),
      ...(args.startDate || args.endDate
        ? {
            createdAt: {
              ...(args.startDate ? { _gte: new Date(args.startDate) } : {}),
              ...(args.endDate ? { _lte: new Date(args.endDate) } : {})
            }
          }
        : {})
    }
  };

  // delegate resolution to wastesCsv and wastesXls with bsdType == BSDD
  return args.exportFormat === "CSV"
    ? wastesRegistryCsvResolverFn(wasteRegistryArgs, context)
    : wastesRegistryXlsResolverFn(wasteRegistryArgs, context);
};

export default formsRegisterResolver;
