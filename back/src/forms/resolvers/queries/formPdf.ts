import { QueryResolvers } from "../../../generated/graphql/types";
import { getFileDownloadToken } from "../../../common/file-download";
import { downloadPdf } from "../../pdf";
import { checkIsAuthenticated } from "../../../common/permissions";
import { NotFormContributor } from "../../errors";
import { isFormContributor } from "../../permissions";
import { getFullForm, getFormOrFormNotFound } from "../../database";
import { getFullUser } from "../../../users/database";

const TYPE = "form_pdf";

const formPdfResolver: QueryResolvers["formPdf"] = async (
  parent,
  { id },
  context
) => {
  // check query level permission
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  // user with linked objects
  const fullUser = await getFullUser(user);
  // form with linked object
  const fullForm = await getFullForm(form);

  // check form level permissions
  if (!isFormContributor(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
};

export default formPdfResolver;
