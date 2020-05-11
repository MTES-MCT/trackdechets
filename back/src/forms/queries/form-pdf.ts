import { getFileDownloadToken } from "../../common/file-download";
import { downloadPdf } from "../pdf";
import { QueryFormPdfArgs, FileDownload } from "../../generated/graphql/types";

const TYPE = "form_pdf";

export function formPdf({ id }: QueryFormPdfArgs): Promise<FileDownload> {
  return getFileDownloadToken({ type: TYPE, params: { id } }, downloadPdf);
}
