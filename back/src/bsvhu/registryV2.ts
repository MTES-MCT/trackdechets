import { Bsvhu } from "@prisma/client";
import type { IncomingWasteV2 } from "@td/codegen-back";
import { getWasteDescription } from "./utils";
import { getBsvhuSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";
import { emptyIncomingWasteV2 } from "../registryV2/types";

export const toIncomingWasteV2 = (
  bsvhu: Bsvhu
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyIncomingWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.createdAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: bsvhu.transporterCompanySiret,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionWeightIsEstimate: null,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationOperationCode: bsvhu.destinationOperationCode,
    destinationOperationMode: bsvhu.destinationOperationMode,
    destinationOperationNoTraceability: false
  };
};
