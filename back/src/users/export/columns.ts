import { format } from "date-fns";
import { UserInCompany } from "./types";
import * as Excel from "exceljs";
import { UserRole } from "@td/prisma";

type Column = {
  field: keyof UserInCompany;
  label: string;
  format?: (v: unknown) => string | number | null;
};

export const formatDate = (d: Date | null) =>
  d ? format(d, "yyyy-MM-dd") : "";

const roleLabels = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.MEMBER]: "Collaborateur",
  [UserRole.READER]: "Lecteur",
  [UserRole.DRIVER]: "Chauffeur"
};

export const formatRole = (r: UserRole) => roleLabels[r];

export const columns: Column[] = [
  { field: "orgId", label: "SIRET ou n° de TVA intracommunautaire" },
  { field: "name", label: "Raison sociale" },
  { field: "givenName", label: "Nom usuel de l'établissement" },
  { field: "userName", label: "Nom et prénom du membre" },
  { field: "userEmail", label: "E-mail du membre" },
  {
    field: "userJoinedAt",
    label: "Date d'ajout du membre",
    format: formatDate
  },
  { field: "userRole", label: "Rôle", format: formatRole }
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

export function getXlsxHeaders(): Partial<Excel.Column>[] {
  return columns.map(c => ({
    header: c.label,
    key: c.field,
    width: 25
  }));
}
