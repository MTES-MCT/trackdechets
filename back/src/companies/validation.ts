import * as yup from "yup";
import { Company, CompanyType } from "@prisma/client";
export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().required()
});

export function isCollector(company: Company) {
  return company.companyTypes.includes(CompanyType.COLLECTOR);
}

export function isWasteProcessor(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTEPROCESSOR);
}