import { getFileDownloadToken } from "../../common/file-download";
import { downloadPdf } from "../pdf";

const TYPE = "form_pdf";

export function formPdf(_, { id }) {
  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
}
