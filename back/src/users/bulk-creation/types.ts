import { InferType } from "yup";
import { companyValidationSchema, roleValidationSchema } from "./validations";

export type CompanyRow = InferType<typeof companyValidationSchema>;

const r = roleValidationSchema([]);
export type RoleRow = InferType<typeof r>;

// Company info from SIRENE API
export interface CompanyInfo {
  name: string;
  codeNaf: string;
  address: string;
  latitude: number;
  longitude: number;
}
