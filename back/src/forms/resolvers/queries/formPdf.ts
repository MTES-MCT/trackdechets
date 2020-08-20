import {
  QueryFormPdfArgs,
  FileDownload,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import { downloadPdf } from "../../pdf";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";
import { FormNotFound, NotFormContributor } from "../../errors";
import { getUserCompanies } from "../../../companies/queries";
import { canGetForm } from "../../permissions";
import { getFullForm } from "../../database";

const TYPE = "form_pdf";

const formPdfResolver: QueryResolvers["formPdf"] = async (
  parent,
  { id },
  context
) => {
  // check query level permission
  const user = checkIsAuthenticated(context);

  const form = await prisma.form({ id });

  if (form == null) {
    throw new FormNotFound(id);
  }

  const userCompanies = await getUserCompanies(context.user.id);

  const fullUser = { ...user, companies: userCompanies };
  const fullForm = await getFullForm(form);

  // check form level permissions
  if (!canGetForm(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default formPdfResolver;
