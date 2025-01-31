import { CreateCompanyFn } from "./company/create";
import { UpdateCompanyFn } from "./company/update";

export type CompanyActions = {
  updateCompany: UpdateCompanyFn;
  createCompany: CreateCompanyFn;
};
