import {
  QueryBsdasriPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import downloadPdf from "../../pdf/download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { isDasriContributor } from "../../permissions";

const TYPE = "bsdasri_pdf";

const bsdasriPdfResolver: QueryResolvers["formPdf"] = async (
  _,
  { id }: QueryBsdasriPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const dasri = await getBsdasriOrNotFound({ id });

  await isDasriContributor(user, dasri);

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default bsdasriPdfResolver;
