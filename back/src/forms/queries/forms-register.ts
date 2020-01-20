import { getFileDownloadToken } from "../../common/file-download";
import { downloadCsvExport } from "../exports/handler";

const TYPE = "forms_register";

export function formsRegister(_, { sirets, exportType }) {
  return getFileDownloadToken(
    { type: TYPE, params: { sirets, exportType } },
    downloadCsvExport
  );
}
