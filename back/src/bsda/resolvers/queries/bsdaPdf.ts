import { QueryBsdaPdfArgs } from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import downloadPdf from "../../pdf/download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

const TYPE = "bsda_pdf";

export default async function bsdaPdf(_, { id }: QueryBsdaPdfArgs, context) {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound(id);

  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
}
