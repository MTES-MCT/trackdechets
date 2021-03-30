import {
  QueryBsvhuPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import downloadPdf from "../../pdf/download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

const TYPE = "vhu_form_pdf";

const formPdfResolver: QueryResolvers["formPdf"] = async (
  _,
  { id }: QueryBsvhuPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound(id);

  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default formPdfResolver;
