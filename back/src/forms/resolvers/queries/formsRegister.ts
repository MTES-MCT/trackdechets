<<<<<<< HEAD
import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import * as yup from "yup";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import {
  QueryFormsRegisterArgs,
  QueryResolvers,
  QueryWastesDownloadLinkArgs
} from "../../../generated/graphql/types";
import { downloadFormsRegister } from "../../exports/handler";
import { formsWhereInput } from "../../exports/where-inputs";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { wastesDownloadHandler } from "../../../register/resolvers/queries/wastesDownloadLink";
=======
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import {
  FormsRegisterExportType,
  QueryResolvers,
  QueryWastesDownloadLinkArgs,
  WasteRegisterType
} from "../../../generated/graphql/types";

import { getWastesDownloadToken } from "../../../register/download";
>>>>>>> 2bd96afb (Regsitre multi-bordereaux combinaison de commits)

// compatibility between register v1 and register v2
const exportTypeToRegisterType: Record<
  FormsRegisterExportType,
  WasteRegisterType
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
 * This resolver calls wastesDownloadLink resolver with bsdType=BSDD
 * for compatibility
 */
const formsRegisterResolver: QueryResolvers["formsRegister"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  for (const siret of args.sirets) {
    // check user is member of every provided sirets
    await checkIsCompanyMember({ id: user.id }, { siret: siret });
  }

  const wasteDownloadLinkArgs: QueryWastesDownloadLinkArgs = {
    registerType: exportTypeToRegisterType[args.exportType],
    fileType: args.exportFormat,
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

  // defer execution to new wastesDownloadHandler
  return getFileDownload({
    handler: wastesDownloadHandler.name,
    params: wasteDownloadLinkArgs
  });
};

export default formsRegisterResolver;
