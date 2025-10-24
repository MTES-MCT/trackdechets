// List all company types that are considered as "waste professionals"
export const PROFESSIONALS = [
  "WASTEPROCESSOR",
  "WASTE_CENTER",
  "COLLECTOR",
  "TRANSPORTER",
  "TRADER",
  "BROKER",
  "ECO_ORGANISME",
  "WASTE_VEHICLES",
  "INTERMEDIARY",
  "DISPOSAL_FACILITY",
  "RECOVERY_FACILITY"
];

export const NON_PROFESSIONALS = ["PRODUCER", "WORKER"];

// min and max lengths for myCompanies resolver search param
export const MIN_MY_COMPANIES_SEARCH = 3;
export const MAX_MY_COMPANIES_SEARCH = 20;

export const isProfessional = companyTypes => {
  return companyTypes.some(companyType => PROFESSIONALS.includes(companyType));
};
