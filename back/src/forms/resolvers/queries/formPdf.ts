import { QueryResolvers } from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import downloadPdf from "../../pdf/downloadPdf";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

const TYPE = "form_pdf";

const formPdfResolver: QueryResolvers["formPdf"] = async (
  parent,
  { id },
  context
) => {
  // check query level permission
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanRead(user, form);

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default formPdfResolver;
