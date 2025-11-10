import { CompanyType, WasteProcessorType, CollectorType } from "@td/prisma";

export const forbbidenProfilesForDangerousWaste = [
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: []
  },
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: [WasteProcessorType.NON_DANGEROUS_WASTES_INCINERATION]
  },
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: [WasteProcessorType.CREMATION]
  },
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: [WasteProcessorType.INERT_WASTES_STORAGE]
  },
  {
    companyTypes: [CompanyType.COLLECTOR],
    collectorTypes: [CollectorType.NON_DANGEROUS_WASTES]
  },
  {
    companyTypes: [CompanyType.COLLECTOR],
    collectorTypes: [CollectorType.OTHER_NON_DANGEROUS_WASTES]
  }
];

export const forbbidenProfilesForNonDangerousWaste = [
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: []
  },
  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_STORAGE]
  },

  {
    companyTypes: [CompanyType.WASTEPROCESSOR],
    wasteProcessorTypes: [WasteProcessorType.OTHER_DANGEROUS_WASTES]
  },
  {
    companyTypes: [CompanyType.COLLECTOR],
    collectorTypes: [CollectorType.DANGEROUS_WASTES]
  },
  {
    companyTypes: [CompanyType.COLLECTOR],
    collectorTypes: [CollectorType.OTHER_DANGEROUS_WASTES]
  }
];
