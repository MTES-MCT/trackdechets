import { QueryCompanyDigestPdfArgs, QueryResolvers } from "@td/codegen-back";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyDigestOrNotFound } from "../../database";

import { createPDFResponse } from "../../../common/pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";

import axios from "axios";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { getUserRoles } from "../../../permissions";

import { UserInputError } from "../../../common/errors";
import { CompanyDigestStatus } from "@prisma/client";
import { logger } from "@td/logger";

const { GERICO_API_KEY, GERICO_API_URL } = process.env;

export const companyDigestPdfDownloadHandler: DownloadHandler<QueryCompanyDigestPdfArgs> =
  {
    name: "companyDigestPdf",
    handler: async (_, res, { id }) => {
      const companyDigest = await getCompanyDigestOrNotFound({ id });

      try {
        const resp = await axios(
          `${GERICO_API_URL}/pdf/${companyDigest.distantId}`,
          {
            method: "GET",
            responseType: "stream",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${GERICO_API_KEY}`
            }
          }
        );

        resp.data.pipe(
          createPDFResponse(res, `fiche-${companyDigest.orgId}.pdf`)
        );
      } catch (_) {
        logger.error(
          `Failed to retrieve companyDigest ${companyDigest.distantId}`
        );
      }
    }
  };

const companyDigestPdfResolver: QueryResolvers["companyDigestPdf"] = async (
  _,
  { id }: QueryCompanyDigestPdfArgs,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const companyDigest = await getCompanyDigestOrNotFound({ id });

  const roles = await getUserRoles(user.id);
  const companies = Object.keys(roles);
  if (!companies.includes(companyDigest.orgId)) {
    throw new UserInputError(
      "Cette fiche établissement n'existe pas ou vous n'avez pas les droits nécessaires pour la consulter."
    );
  }
  if (companyDigest.state !== CompanyDigestStatus.PROCESSED) {
    throw new UserInputError(
      "Cette fiche établissement n'est pas consultable."
    );
  }

  return getFileDownload({
    handler: companyDigestPdfDownloadHandler.name,
    params: { id }
  });
};

export default companyDigestPdfResolver;
