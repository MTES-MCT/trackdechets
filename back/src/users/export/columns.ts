import { format } from "date-fns";
import { UserInCompany } from "./types";
import * as Excel from "exceljs";

type Column = {
  field: keyof UserInCompany;
  label: string;
  format?: (v: unknown) => string | number | null;
};

const formatDate = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : "");

export const columns: Column[] = [
  { field: "orgId", label: "SIRET ou n° de TVA intracommunautaire" },
  { field: "name", label: "Raison sociale" },
  { field: "givenName", label: "Nom usuel de l'établissement" },
  { field: "userName", label: "Nom et prénom" },
  { field: "userEmail", label: "E-mail" },
  {
    field: "userJoinedAt",
    label: "Date d'ajout du membre",
    format: formatDate
  },
  { field: "userRole", label: "Rôle" }
];

export function formatRow(userInCompany: UserInCompany, useLabelAsKey = false) {
  return columns.reduce((acc, column) => {
    if (column.field in userInCompany) {
      const key = useLabelAsKey ? column.label : column.field;
      return {
        ...acc,
        [key]: column.format
          ? column.format(userInCompany[column.field])
          : userInCompany[column.field] ?? ""
      };
    }
    return acc;
  }, {});
}

/**
 * GET XLSX headers based of the first row
 */
export function getXlsxHeaders(
  userInCompany: UserInCompany
): Partial<Excel.Column>[] {
  return columns.reduce<Partial<Excel.Column>[]>((acc, column) => {
    if (column.field in userInCompany) {
      return [
        ...acc,
        {
          header: column.label,
          key: column.field,
          width: 20
        }
      ];
    }
    return acc;
  }, []);
}
