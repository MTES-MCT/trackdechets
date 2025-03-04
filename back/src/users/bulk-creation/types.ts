import { InferType } from "yup";
import { companyValidationSchema, roleValidationSchema } from "./validations";

export type CompanyRow = InferType<typeof companyValidationSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const r = roleValidationSchema([]);
export type RoleRow = InferType<typeof r>;

// Company info from SIRENE API
export interface CompanyInfo {
  name: string | null | undefined;
  codeNaf: string | null | undefined;
  address: string | null | undefined;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  addressCity: string | null | undefined;
  addressPostalCode: string | null | undefined;
  addressVoie: string | null | undefined;
  codePaysEtrangerEtablissement: string | null | undefined;
}
