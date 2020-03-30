import { InferType } from "yup";
import { companyValidationSchema, roleValidationSchema } from "./validations";

export type CompanyRow = InferType<typeof companyValidationSchema>;

const r = roleValidationSchema([]);
export type RoleRow = InferType<typeof r>;

// Company info from SIRENE API
export interface CompanyInfo {
  etablissement: {
    unite_legale: {
      denomination: string;
    };
    activite_principale: string;
  };
}
