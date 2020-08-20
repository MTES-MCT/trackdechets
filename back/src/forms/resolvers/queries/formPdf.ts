import { QueryResolvers } from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import { downloadPdf } from "../../pdf";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";
import { FormNotFound, NotFormContributor } from "../../errors";
import { canGetForm } from "../../permissions";
import { getFullForm } from "../../database";
import { getFullUser } from "../../../users/database";

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

  // user with linked objects
  const fullUser = await getFullUser(user);
  // form with linked object
  const fullForm = await getFullForm(form);

  // check form level permissions
  if (!canGetForm(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default formPdfResolver;
