import {
  QueryFormPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanRead } from "../../permissions";
import downloadPdf from "../../pdf/downloadPdf";
import { DownloadHandler } from "../../../routers/downloadRouter";

export const formPdfDownloadHandler: DownloadHandler<QueryFormPdfArgs> = {
  name: "formPdf",
  handler: downloadPdf
};

const formPdfResolver: QueryResolvers["formPdf"] = async (
  parent,
  { id },
  context
) => {
  // check query level permission
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanRead(user, form);

  return getFileDownload({
    handler: formPdfDownloadHandler.name,
    params: { id }
  });
};

export default formPdfResolver;
