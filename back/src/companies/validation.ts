import * as yup from "yup";
import { Company, CompanyType } from "@prisma/client";
import { isForeignVat } from "@td/constants";

export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().required()
});

export function isCollector(company: Company) {
  return company.companyTypes.includes(CompanyType.COLLECTOR);
}

export function isWasteProcessor(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTEPROCESSOR);
}

export function isWasteCenter(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTE_CENTER);
}

export function isWasteVehicles(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTE_VEHICLES);
}

export function isTransporter({
  companyTypes
}: {
  companyTypes: CompanyType[];
}) {
  return companyTypes.includes(CompanyType.TRANSPORTER);
}

export function isForeignTransporter({
  companyTypes,
  vatNumber
}: {
  companyTypes: CompanyType[];
  vatNumber?: string | null;
}) {
  return isTransporter({ companyTypes }) && isForeignVat(vatNumber);
}

export function isWorker(company: Company) {
  return company.companyTypes.includes(CompanyType.WORKER);
}
export function isCrematorium(company: Company) {
  return company.companyTypes.includes(CompanyType.CREMATORIUM);
}
