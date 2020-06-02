import { getFileDownloadToken } from "../../common/file-download";
import { downloadCsvExport } from "../exports/handler";
import {
  QueryFormsRegisterArgs,
  FileDownload
} from "../../generated/graphql/types";

const TYPE = "forms_register";

export function formsRegister({
  sirets,
  exportType
}: QueryFormsRegisterArgs): Promise<FileDownload> {
  return getFileDownloadToken(
    { type: TYPE, params: { sirets, exportType } },
    downloadCsvExport
  );
}
