import * as yup from "yup";
import {
  CollectorType,
  Company,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
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

const toSet = (_, value) => [...new Set(value?.filter(Boolean))];

export const companyTypesValidationSchema = yup.object({
  companyTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(CompanyType)))
    .ensure()
    .compact()
    .transform(toSet)
    .required()
    .min(1),
  collectorTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(CollectorType)))
    // .ensure()
    .compact()
    .transform(toSet)
    .test(
      "collectorTypes",
      "Your company needs to be a Collector to have collectorTypes",
      async (collectorTypes, ctx) => {
        const { companyTypes } = ctx.parent;

        if (
          collectorTypes?.length &&
          !companyTypes.includes(CompanyType.COLLECTOR)
        ) {
          return false;
        }

        return true;
      }
    ),
  wasteProcessorTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(WasteProcessorType)))
    // .ensure()
    .compact()
    .transform(toSet)
    .test(
      "wasteProcessorTypes",
      "Your company needs to be a WasteProcessor to have wasteProcessorTypes",
      async (wasteProcessorTypes, ctx) => {
        const { companyTypes } = ctx.parent;

        if (
          wasteProcessorTypes?.length &&
          !companyTypes.includes(CompanyType.WASTEPROCESSOR)
        ) {
          return false;
        }

        return true;
      }
    )
});
