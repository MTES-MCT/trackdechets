import { InferType } from "yup";
import { companyValidationSchema, roleValidationSchema } from "./validations";

export type CompanyRow = InferType<typeof companyValidationSchema>;

const r = roleValidationSchema([]);
export type RoleRow = InferType<typeof r>;

// Company info from SIRENE API
export interface CompanyInfo {
  name: string | null | undefined;
  codeNaf: string | null | undefined;
  address: string | null | undefined;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}
