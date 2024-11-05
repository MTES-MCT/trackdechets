import { CollectorType, WasteProcessorType, Company } from "@prisma/client";

const hasAuthorization = (requiredAuthorizations, companySubTypes): boolean => {
  const matching = requiredAuthorizations.filter(i =>
    companySubTypes.includes(i)
  );
  return !!matching.length;
};

export const canProcessDangerousWaste = (company: Company): boolean => {
  const collectorAuthorizations = [
    CollectorType.DANGEROUS_WASTES,
    CollectorType.DEEE_WASTES,
    CollectorType.OTHER_DANGEROUS_WASTES
    // NON_DANGEROUS_WASTES
    // OTHER_NON_DANGEROUS_WASTES
  ];
  const wasteProcessorAuthorizations = [
    WasteProcessorType.DANGEROUS_WASTES_INCINERATION,
    WasteProcessorType.DANGEROUS_WASTES_STORAGE,
    WasteProcessorType.NON_DANGEROUS_WASTES_STORAGE,
    WasteProcessorType.OTHER_DANGEROUS_WASTES
    // NON_DANGEROUS_WASTES_INCINERATION
    // CREMATION
    // INERT_WASTES_STORAGE
    // OTHER_NON_DANGEROUS_WASTES
  ];

  const requiredAuthorizations = [
    ...collectorAuthorizations,
    ...wasteProcessorAuthorizations
  ];
  const companySubTypes = [
    ...company.collectorTypes,
    ...company.wasteProcessorTypes
  ];

  return hasAuthorization(requiredAuthorizations, companySubTypes);
};
export const canProcessNonDangerousWaste = (company: Company): boolean => {
  const collectorAuthorizations = [
    CollectorType.NON_DANGEROUS_WASTES,
    CollectorType.DEEE_WASTES,
    CollectorType.OTHER_NON_DANGEROUS_WASTES
    // DANGEROUS_WASTES
    //OTHER_DANGEROUS_WASTES
  ];

  const wasteProcessorAuthorizations = [
    WasteProcessorType.DANGEROUS_WASTES_INCINERATION,
    WasteProcessorType.NON_DANGEROUS_WASTES_INCINERATION,
    WasteProcessorType.CREMATION,
    WasteProcessorType.NON_DANGEROUS_WASTES_STORAGE,
    WasteProcessorType.INERT_WASTES_STORAGE,
    WasteProcessorType.OTHER_NON_DANGEROUS_WASTES
    // DANGEROUS_WASTES_STORAGE
    // OTHER_DANGEROUS_WASTES
  ];

  const requiredAuthorizations = [
    ...collectorAuthorizations,
    ...wasteProcessorAuthorizations
  ];
  const companySubTypes = [
    ...company.collectorTypes,
    ...company.wasteProcessorTypes
  ];

  return hasAuthorization(requiredAuthorizations, companySubTypes);
};
