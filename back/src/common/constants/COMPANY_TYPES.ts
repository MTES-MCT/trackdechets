import { CompanyType } from "@prisma/client";

// List all company types that are considered as "waste professionals"
export const PROFESSIONALS: CompanyType[] = [
  CompanyType.WASTEPROCESSOR,
  CompanyType.COLLECTOR,
  CompanyType.TRANSPORTER,
  CompanyType.TRADER,
  CompanyType.ECO_ORGANISME,
  CompanyType.WASTE_VEHICLES
];
