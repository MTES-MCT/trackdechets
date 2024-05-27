import { format } from "date-fns";

export function getCompaniesExportFileName() {
  return `${format(new Date(), "yyyyMMdd")}-mes-etablissements`;
}
