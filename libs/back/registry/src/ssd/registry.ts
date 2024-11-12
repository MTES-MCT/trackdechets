import { RegistrySsd } from "@prisma/client";

import { SsdWaste } from "@td/codegen-back";
export const toSsdWaste = (ssd: RegistrySsd): SsdWaste => {
  const realWeight = ssd.weightIsEstimate ? null : ssd.weightValue;
  const estimatedWeight = ssd.weightIsEstimate ? ssd.weightValue : null;

  return {
    id: ssd.id,
    source: "REGISTRY",
    publicId: ssd.publicId,
    reportForSiret: ssd.reportForSiret,
    reportForName: ssd.reportForName,
    reportForAddress: ssd.reportForAddress,
    reportForCity: ssd.reportForCity,
    reportForPostalCode: ssd.reportForPostalCode,
    reportAsSiret: ssd.reportAsSiret,
    realWeight,
    estimatedWeight,
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
    destinationType: ssd.destinationType,
    destinationOrgId: ssd.destinationOrgId,
    destinationName: ssd.destinationName,
    destinationAddress: ssd.destinationAddress,
    destinationPostalCode: ssd.destinationPostalCode,
    destinationCity: ssd.destinationCity,
    destinationCountryCode: ssd.destinationCountryCode,
    operationCode: ssd.operationCode,
    operationMode: ssd.operationMode,
    administrativeActReference: ssd.administrativeActReference
  };
};
