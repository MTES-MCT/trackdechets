import { RegistrySsd } from "@prisma/client";

import type { SsdWaste } from "@td/codegen-back";
export const toSsdWaste = (ssd: RegistrySsd): SsdWaste => {
  return {
    id: ssd.id,
    source: "REGISTRY",
    publicId: ssd.publicId,
    reportForSiret: ssd.reportForCompanySiret,
    reportForName: ssd.reportForCompanyName,
    reportForAddress: ssd.reportForCompanyAddress,
    reportForCity: ssd.reportForCompanyCity,
    reportForPostalCode: ssd.reportForCompanyPostalCode,
    reportAsSiret: ssd.reportAsCompanySiret,
    weightValue: ssd.weightValue,
    weightIsEstimate: ssd.weightIsEstimate,
    volume: ssd.volume,
    useDate: ssd.useDate,
    dispatchDate: ssd.dispatchDate,
    wasteCode: ssd.wasteCode,
    wasteDescription: ssd.wasteDescription,
    wasteCodeBale: ssd.wasteCodeBale,
    secondaryWasteCodes: ssd.secondaryWasteCodes,
    secondaryWasteDescriptions: ssd.secondaryWasteDescriptions,
    product: ssd.product,
    processingDate: ssd.processingDate,
    processingEndDate: ssd.processingEndDate,
    destinationType: ssd.destinationCompanyType,
    destinationOrgId: ssd.destinationCompanyOrgId,
    destinationName: ssd.destinationCompanyName,
    destinationAddress: ssd.destinationCompanyAddress,
    destinationPostalCode: ssd.destinationCompanyPostalCode,
    destinationCity: ssd.destinationCompanyCity,
    destinationCountryCode: ssd.destinationCompanyCountryCode,
    operationCode: ssd.operationCode,
    operationMode: ssd.operationMode,
    administrativeActReference: ssd.administrativeActReference
  };
};
